import { Prisma, User as UserEntity, UserLink, UserStackVote, UserAvatar, Image as ImageEntity } from "@/.generated/prisma";
import { KnowType } from "@/lib/shared/tag-system/_enums/know-type.enum";
import { prisma } from "@/lib/prisma";
import IUserService, { EditUser, User, WriteUser } from "./user.service.interface";
import Image from "@/lib/shared/cdn/_types/Image";
import Tag from "@/lib/shared/tag-system/_types/Tag";
import { Item } from "@/lib/shared/tag-system/_types/Item";
import { Link } from "@/lib/shared";

// Pure profile/identity service over the local (pandc) DB. The user's graph tags and
// their projects live in the Catalog — pandc fetches those via REST, not here.
export default class UserService implements IUserService {
  async add(write: WriteUser): Promise<User> {
    var newUser = await prisma.user.create({
      data: {
        nickname: write.nickname,
        about: write.about,
        tgId: write.tgId,
        ...(write.avatars.length > 0 ? { avatars: this.convertToDbImages(write.avatars) } : {})
      },
      include: {
        links: true,
        avatars: {
          include: {
            image: true
          }
        },
        covers: {
          include: {
            image: true
          }
        },
      }
    })

    interface LinkToSave{
      userId: string,
      name: string,
      url: string
    }
    var linksToSave: LinkToSave[] = []
    write.links.forEach(l => linksToSave.push({ userId: newUser.id, name: l.name, url: l.url }))

    var newLinks = await prisma.userLink.createManyAndReturn({
      data: linksToSave
    })

    newUser.links = newLinks

    // The User graph node is created lazily (keyed by the user's sub/kratosId) the
    // first time the user sets skills or is linked as a contributor — see the re-key
    // to sub. We must not create it here, where kratosId may not exist yet.
    const result = this.mapToUser(newUser, null)
    return result
  }
  async edit(id: string, edit: EditUser): Promise<User> {
    const updatedUser = await prisma.user.update({
      where: {
        id: id
      },
      data: {
        nickname: edit.nickname == null || edit.nickname == undefined ? Prisma.skip : edit.nickname,
        about: edit.about == undefined ? Prisma.skip : edit.about,
      },
      include: {
        links: true,
        avatars: {
          include: {
            image: true
          }
        },
        covers: {
          include: {
            image: true
          }
        },
      }
    })

    const result = await this.mapToUser(updatedUser, null)
    return result
  }
  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: {
        id: id
      }
    })
    // The user's graph node (skills) is Catalog-owned; orphan nodes are harmless and
    // skipped on read. No graph cleanup from pandc.
  }
  async getByIdsLight(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return []
    const users = await prisma.user.findMany({
      where: { id: { in: ids } },
      include: {
        links: true,
        avatars: { include: { image: true } },
        covers: { include: { image: true } }
      }
    })
    return Promise.all(users.map(u => this.mapToUser(u, null)))
  }

  // Resolve users by their sub (kratosId) — the key the graph stores for User nodes
  // after the re-key. Used by the graph hydration path.
  async getByKratosIdsLight(subs: string[]): Promise<User[]> {
    if (subs.length === 0) return []
    const users = await prisma.user.findMany({
      where: { kratosId: { in: subs } },
      include: {
        links: true,
        avatars: { include: { image: true } },
        covers: { include: { image: true } }
      }
    })
    return Promise.all(users.map(u => this.mapToUser(u, null)))
  }

  async getByKratosId(sub: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: { kratosId: sub },
      include: {
        links: true,
        avatars: { include: { image: true } },
        covers: { include: { image: true } }
      }
    })
    if (user == null) return null
    return await this.mapToUser(user, null)
  }

  async getById(id: string): Promise<User | null> {
    var user = await prisma.user.findFirst({
      where: {
        id: id
      },
      include: {
        links: true,
        avatars: {
          include: {
            image: true
          }
        },
        covers: {
          include: {
            image: true
          }
        },
      }
    })
    if(user == null) return null

    const uItem = null /* tags decoupled: fetched from Catalog, not the local graph */

    const result = await this.mapToUser(user, uItem)
    return result
  }
  async getAll(): Promise<User[]> {
    var result: User[] = []

    const users = await prisma.user.findMany({
      include: {
        links: true,
        avatars: {
          include: {
            image: true
          }
        },
        covers: {
          include: {
            image: true
          }
        },
      }
    })
    
    for(const user of users) {
      const uItem = null /* tags decoupled: fetched from Catalog, not the local graph */
      const r = await this.mapToUser(user, uItem)
      result.push(r)
    }

    return result
  }
  async find(q?: string): Promise<User[]> {
    var result: User[] = []

    const users = q != undefined 
    ? await prisma.user.findMany({
      where: {
        nickname: q
      },
      include: {
        links: true,
        avatars: {
          include: {
            image: true
          }
        },
        covers: {
          include: {
            image: true
          }
        },
      }
    })
    : await prisma.user.findMany({
        include: {
          links: true,
          avatars: {
            include: {
              image: true
            }
          },
          covers: {
          include: {
            image: true
          }
        },
        }
    })

    for(var user of users) {
        const uItem = null /* tags decoupled: fetched from Catalog, not the local graph */
        const resUser = await this.mapToUser(user, uItem)

        result.push(resUser)
    }

    return result
  }
  async addAvatar(id: string, image: Image): Promise<void> {
    const newImage = await prisma.image.create({
      data: {
        src: image.src
      }
    })

    await prisma.userAvatar.create({
      data: {
        userId: id,
        imageId: newImage.id
      }
    })
  }
  async setAvatar(id: string, image: Image | null): Promise<void> { // need fix
    throw new Error("Method not implemented.");
  }
  async removeAvatar(id: string, image: Image): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async addCover(id: string, image: Image & { kind?: string }): Promise<void> {
    const newImage = await prisma.image.create({
      data: {
        src: image.src
      }
    })

    await prisma.userCover.create({
      data: {
        userId: id,
        imageId: newImage.id
      }
    })
  }
  async setCover(id: string, image: Image | null): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async removeCover(id: string, image: Image): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async linkTag(id: string, tag: Tag): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async unlinkTag(id: string, tag: Tag): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async addLink(id: string, link: Link): Promise<void> {
    await prisma.userLink.create({
      data: {
        userId: id,
        name: link.name,
        url: link.url
      }
    })
  }
  async removeLink(id: string, linkId: string): Promise<void> {
    await prisma.userLink.delete({
      where: {
        id: linkId,
        userId: id
      }
    })
  }

  // helpers
  async mapToUser(
    user: { 
      links: { name: string; id: string; createdAt: Date; updatedAt: Date; url: string; userId: string | null; }[]
      avatars: any,
      covers: any,
     } & UserEntity, 
    uItem: Item | null
  ): Promise<User> {
    const avatarsData: Image[] = this.imageMapper(user.avatars, "/cdn/avatars/")
    const coversData: Image[] = this.imageMapper(user.covers, "/cdn/covers/")
    
    var result: User = {
      id: user.id,
      nickname: user.nickname ?? "",
      about: user.about,
      tgId: user.tgId,
      kratosId: user.kratosId ?? null,
      avatars: avatarsData,
      covers: coversData,
      links: user.links,
      tags: uItem?.tags ?? []
    }
    return result
  }

  imageMapper(images: any, rootPath: string): Image[]{
    var result: Image[] = []

    if(images.length == 0) return []

    for(var av of images) {
      const rawSrc: string = av.image.src
      const newImage: Image = {
        id: av.imageId,
        src: rawSrc.startsWith('http') ? rawSrc : rootPath + rawSrc,
        index: av.index
      }
      result.push(newImage)
    }

    return result
  }

  convertToDbImages(images: Image[]): any {
    return {
      create: images.map(img => ({
        image: { create: { src: img.src } },
        index: img.index ?? -1
      }))
    }
  }
  
}

// export async function getAllUsers() {
//   var allUsers: UserEntity[] = await prisma.user.findMany({include: { 
//     links: true,
//     stackVotes: true
//    }})

//   return allUsers;
// }

// export async function getUser(id: string): Promise<User> {
//   var user: UserEntity = await prisma.user.findUniqueOrThrow({
//     where: {
//       id: id
//     }
//   })

//   user.stackVotes = await getUserLastStacks(user.id);
//   user.links = await getLinks(user.id)

//   return user;
// }

// export async function addUser(id: string, tg_id: string, nickname: string, avatar_src?: string, name?: string): Promise<User> {
//   var user: User = await prisma.user.create({
//     data: {
//       id: id,
//       tgId: tg_id.toString(),
//       nickname: nickname,
//       image: avatar_src,
//       name: name
//     },
//   })
//   return user;
// }

// export async function updateUser(id: string, nickname: string | undefined, about: string | undefined = undefined): Promise<User> {
//   const user: User = await prisma.user.update({
//     where: {
//       id: id
//     },
//     data: {
//       nickname: nickname == null || nickname == undefined ? Prisma.skip : nickname,
//       about: about == undefined ? Prisma.skip : about,
//       // votes: votes == undefined ? Prisma.skip : votes
//       //image: avatar_src == undefined ? Prisma.skip : avatar_src,
//     },
//   })
//   return user;
// }

// export async function updateAvatar(user_id: string, avatar_src: string | null | undefined = undefined) {
//   await prisma.user.update({
//     where: {
//       id: user_id
//     },
//     data: {
//       image: avatar_src == undefined ? Prisma.skip : avatar_src
//     },
//   })
// }

// async function getUserLastStacks(userId: string): Promise<UserStackVote[]> {
//   var allUserStacks: UserStackVote[] = await prisma.userStackVote.findMany({
//     orderBy: {
//       createdAt: "desc"
//     },
//     where: {
//       userId: userId
//     }
//   })

//   var lastUserStack: UserStackVote[] = []
//   allUserStacks.forEach(s => {
//     var thatSameVal: UserStackVote | undefined = lastUserStack.find(l => l.stackId == s.stackId && l.userId == s.userId)
//     if(thatSameVal == undefined) lastUserStack.push(s)
//   })

//   return lastUserStack
// }

// async function getLinks(user_id: string): Promise<UserLink[]> {
//   return await prisma.userLink.findMany({
//     where: {
//       userId: user_id
//     }
//   })
// }

// export async function updateLinks(user_id: string, links: Link[]){
//   interface LinkToSave{
//     userId: string,
//     name: string,
//     url: string
//   }

//   await prisma.userLink.deleteMany({
//     where: {
//       userId: user_id
//     }
//   })

//   var linksToSave: LinkToSave[] = []
//   links.forEach(l => linksToSave.push({ userId: user_id, name: l.name, url: l.url }))

//   await prisma.userLink.createMany({
//     data: linksToSave
//   })
// }

export async function makeVote(userId: string, stackId: string, status: KnowType) {
  var lastTheatSameVote = await getLastVoteWithParametr(userId, stackId)
  if(lastTheatSameVote == null) {
    if(status == KnowType.NONE) return

    await make(userId, stackId, status)
    return
  }
  
  if(lastTheatSameVote.engagementStatus == status) return
  else await update(userId, stackId, status)

  async function make(userId: string, stackId: string, status: string) {
    await prisma.userStackVote.create({
      data: {
        userId: userId,
        stackId: stackId,
        engagementStatus: status
      }
    })
  }
  
  async function update(userId: string, stackId: string, status: string) {
    await prisma.userStackVote.update({
      where: {
        userId_stackId: {
          userId: userId,
          stackId: stackId
        }
      },
      data: {
        engagementStatus: status
      }
    })
  }

  async function getLastVoteWithParametr(userId: string, stackId: string): Promise<UserStackVote | null>{
    return await prisma.userStackVote.findFirst({
      orderBy: {
        createdAt: "desc"
      },
      where: {
        userId: userId,
        stackId: stackId
      }
    })
  }
}

// export interface User {
//   id: string,
//   tgId?: string | null,
//   nickname?: string | null,
//   about?: string | null,
//   image?: string | null,
//   links?: Array<UserLink>,
//   stackVotes?: UserStackVote[]
// }

export interface StackVote {
  stackId: string,
  status: KnowType
}