import { prisma } from "@/lib/prisma";
import path from "path";
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import CyrillicToTranslit from 'cyrillic-to-translit-js';
import saveFileOnServer from "../cdn/FileService";
import IUserService, { User, WriteUser } from "../user/user.service.interface";
import UserService from "../user/UserService";
import { Link } from "@/lib/shared";
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

let _userService: IUserService | null = null
function getUserService(): IUserService {
  if (!_userService) _userService = new UserService()
  return _userService
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