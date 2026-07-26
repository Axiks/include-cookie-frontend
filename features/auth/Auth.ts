import { prisma } from "@/lib/prisma";
import path from "path";
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import CyrillicToTranslit from 'cyrillic-to-translit-js';
import saveFileOnServer from "../cdn/FileService";
import IUserService, { User, WriteUser } from "../user/user.service.interface";
import UserService from "../user/UserService";
import { Link } from "@/lib/shared";
import { User as UserPrisma } from "@/.generated/prisma";
import { findOrCreateKratosIdentity, reconcileLocalProfile } from "./kratos-bridge";
import type { TelegramVerifiedIdentity } from "./telegram-auth.interface";

// Ensures the Kratos identity exists, then reconciles the local cache from the
// canonical Kratos traits. Non-blocking + non-fatal so login stays fast and a
// Kratos hiccup never breaks sign-in.
function syncAndReconcile(
  userId: string,
  params: { tgId: string; nickname: string; avatarUrl?: string | null }
): void {
  findOrCreateKratosIdentity(params)
    .then(kratosId => reconcileLocalProfile(userId, kratosId))
    .catch(e => console.warn("[Auth] Kratos identity sync failed (non-critical):", e?.message))
}
// import { addUser, Link, updateAvatar, updateLinks, updateUser, User } from "../user/UserService";

var jwt = require('jsonwebtoken');
let _userService: IUserService | null = null
function getUserService(): IUserService {
  if (!_userService) _userService = new UserService()
  return _userService
}

export async function decodeToken(token: string): Promise<TokenDataPayload | undefined> {
  try {
    return jwt.verify(
      token, 
      process.env.TOKEN_KEY, 
      {
          issuer: process.env.TOKEN_ISS, 
          audience: process.env.TOKEN_AUD
      });
  } catch(err) {
    return undefined;
  }
}

export async function userRegisterMidlware(token: TokenDataPayload): Promise<User> {
  var userFromDb: UserPrisma | null = await prisma.user.findUnique({
    where: {
      tgId: String(token.tg_id)
    }
  });

  if(userFromDb === null) {
    var nickname = token.nick
    if(nickname == undefined && token.name != undefined && token.name != "" ) {
      const cyrillicToTranslit = CyrillicToTranslit({
        preset: "uk"
      });
      nickname = cyrillicToTranslit.transform(token.name, '_')
    }
    nickname = nickname ?? randomUUID().slice(0,8)

    var links: Link[] = token.nick
      ? [{ name: "t.me/" + token.nick, url: "https://t.me/" + token.nick }]
      : []

    var avatars: { src: string }[] = []
    const avatarUrl = await tryGetDownloadUrl(token.avatar_src, token.iss)
    if (avatarUrl) {
      const filename = await loadAvatar(avatarUrl)
      if (filename) avatars = [{ src: filename }]
    }

    const writeUser: WriteUser = {
      tgId: String(token.tg_id),
      nickname: nickname,
      about: null,
      links: links,
      tags: [],
      avatars: avatars
    }
    var newUser = await getUserService().add(writeUser)

    syncAndReconcile(newUser.id, {
      tgId: String(token.tg_id),
      nickname: nickname,
      avatarUrl: avatars[0]?.src ?? null,
    })

    return newUser
  };

  const user = await getUserService().getById(userFromDb.id)
  if (!user) throw new Error("User not found in item service for id: " + userFromDb.id)

  syncAndReconcile(user.id, {
    tgId: String(token.tg_id),
    nickname: user.nickname,
    avatarUrl: user.avatars[0]?.src ?? null,
  })

  return user
}

async function tryGetDownloadUrl( token_avatar_src: string | undefined, token_iss: string ): Promise<string | undefined> {
  if(!token_avatar_src) {
    console.log("[Avatar] No avatar_src in token — skipping download")
    return undefined
  }

  if(token_iss == process.env.TOKEN_ISS){
    const botToken = process.env.BOT_TOKEN
    if (!botToken) {
      console.warn("[Avatar] BOT_TOKEN env var is not set — cannot build TG file URL")
      return undefined
    }

    const getMeUrl = `https://api.telegram.org/bot${botToken}/getMe`
    try {
      const getMeRes = await fetch(getMeUrl)
      const getMeJson = await getMeRes.json()
      if (getMeJson.ok) {
        console.log(`[Avatar] Bot token valid. Bot: @${getMeJson.result.username}`)
      } else {
        console.warn("[Avatar] Bot token invalid:", getMeJson.description)
        return undefined
      }
    } catch (e) {
      console.warn("[Avatar] Failed to reach Telegram API:", e)
      return undefined
    }

    const url = `https://api.telegram.org/file/bot${botToken}/${token_avatar_src}`
    console.log("[Avatar] TG file URL:", url)
    return url
  }

  console.log("[Avatar] External avatar URL:", token_avatar_src)
  return token_avatar_src
}

async function loadAvatar(avatar_href: string): Promise<string | null> {
  try {
    const avatar_name = randomUUID().toString() + ".png"
    await avatarDownloaderHelper(avatar_href, avatar_name)
    console.log("[Avatar] Downloaded successfully:", avatar_name)
    return avatar_name
  } catch (e) {
    console.warn("[Avatar] Failed to download avatar:", e)
    return null
  }
}

export interface TokenDataPayload {
    iss: string,
    aud: string,
    sub: string,
    nick?: string,
    name?: string,
    tg_id: string,
    avatar_src?: string,
    role: string[],
    iat: number,
    exp: number
}

export async function userRegisterViaWidget(identity: TelegramVerifiedIdentity): Promise<User> {
    const existing = await prisma.user.findUnique({ where: { tgId: identity.tgId } })

    if (!existing) {
        const cyrillicToTranslit = CyrillicToTranslit({ preset: 'uk' })
        const nickname = identity.username
            ?? cyrillicToTranslit.transform(identity.displayName, '_')

        const links: Link[] = identity.username
            ? [{ name: 't.me/' + identity.username, url: 'https://t.me/' + identity.username }]
            : []

        let avatars: { src: string }[] = []
        if (identity.photoUrl) {
            const filename = await loadAvatar(identity.photoUrl).catch(() => null)
            if (filename) avatars = [{ src: filename }]
        }

        await getUserService().add({
            tgId: identity.tgId,
            nickname,
            about: null,
            links,
            tags: [],
            avatars,
        })
    }

    const userFromDb = await prisma.user.findUnique({ where: { tgId: identity.tgId } })
    if (!userFromDb) throw new Error('User not found after register for tgId: ' + identity.tgId)

    let user = await getUserService().getById(userFromDb.id)
    if (!user) throw new Error('User not found in service for id: ' + userFromDb.id)

    // For existing users without an avatar — download if photoUrl is available
    if (identity.photoUrl && user.avatars.length === 0) {
        const filename = await loadAvatar(identity.photoUrl).catch(() => null)
        if (filename) {
            await getUserService().addAvatar(userFromDb.id, { src: filename })
            user = (await getUserService().getById(userFromDb.id)) ?? user
        }
    }

    syncAndReconcile(userFromDb.id, {
        tgId: identity.tgId,
        nickname: user.nickname,
        avatarUrl: user.avatars[0]?.src ?? null,
    })

    return user
}

async function avatarDownloaderHelper(url: string, filename: string){
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Image fetch failed: ${response.status} ${response.statusText}`)

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await saveFileOnServer(buffer, 'avatars', filename)
}