'use server'

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { Link } from "@/lib/shared";
import { Contributor, EditProject, IProjectService, WriteProject } from "@/lib/shared/project/project.service.interface";
import ITagService, { WriteTag } from "@/lib/shared/tag-system/tag/service/tag.service.interface"
import { FormState, fromErrorToFormState } from "@/lib/utils/form-utils"
import z from "zod";
import Image from "@/lib/shared/cdn/_types/Image"
import { CoverKind } from "@/lib/shared/project/_enums/cover-kind.enum";
import saveFileOnServer from "@/features/cdn/FileService";
import Tag, { TagData } from "@/lib/shared/tag-system/_types/Tag";
import { getCatalog } from "@/lib/catalog";
import { IGroupService } from "@/lib/shared/tag-system/group/service/group.service.interface";
import { GetGroupsTags } from "@/features/_helpers/TagScreenerHelper";

export const saveProjectConfigForm = async (formState: FormState, formData: FormData) => {
  const tagService: ITagService = getCatalog().tags()
  const groupService: IGroupService = getCatalog().groups()

  const linkShema = z.object({
    name: z.string(),
    url: z.url(),
  })
  const linksShema = z.array(linkShema)
  
  console.log("Project config formData")
  console.log(formData)

  let redirectTo: string | null = null

  try{
     const configShema = z.object({
      title: z.string().min(4).max(32),
      about: z.string().min(0).max(4096),
      links: linksShema,
    })

    const id: string | null = formData.get("id") ? formData.get("id")!.toString() : null
    const title: string | null = formData.get("title") ? formData.get("title")!.toString() : null
    const about: string | null = formData.get("about") ? formData.get("about")!.toString() : null

    var links: Link[] = []
    const linksJsonData: string | null =  formData.get("links") ? formData.get("links")!.toString() : null
    if(linksJsonData != undefined) links = JSON.parse(linksJsonData)

    configShema.parse({
      title: title,
      about: about,
      links: links,
    })

    // let projectMembersDtoData = formData.get("members")!.toString()
    // let projectMembersData: ProjectMemberDTO[] = JSON.parse(projectMembersDtoData)
    //let projectMembersData: ProjectMemberDTO[] = [] // temp

    // console.log("projectMembersDtoData")
    // console.log(projectMembersDtoData)

    const session = await auth()
    // Contributors are keyed by sub (kratosId) — the cross-service user key.
    const currentUserSub = session!.user!.kratosId
    if (!currentUserSub) throw new Error("No kratos identity for current user")

    // const tagService: ITagService = getCatalog().tags()
    // const ownerTag = await tagService.getByName("owner")

    var contributor: Contributor[] = []
    // const itemService: IItemService = new ItemService()
    // current user is owner
    const currentUser: Contributor = {
      userId: currentUserSub,
      nickname: "",
      roleTags: []
    }

    contributor.push(currentUser)

    // for(var member of projectMembersData) {
    //   var userFromItemService = await itemService.getById(member.user.id)
    //   if(userFromItemService == null) {
    //     const newUserInItemService: WriteItem = {
    //       objectId: member.user.id,
    //       objectType: "User"
    //     }
    //     const newUserItem = await itemService.add(newUserInItemService)

    //     const image: Image | undefined = member.user.image != null && member.user.image != undefined ? {
    //       src:  member.user.image 
    //     } : undefined

    //     const newContributor: Contributor = {
    //       userId: member.user.id,
    //       nickname: member.user.nickname ?? "",
    //       avatar: image,
    //       // roleTags: member.tags
    //     }
    //     contributor.push(newContributor)
    //     //userFromItemService = newUserItem
    //   }
    //   else{

    //     const image: Image | undefined = member.user.image != null && member.user.image != undefined ? {
    //       src:  member.user.image 
    //     } : undefined

    //     const newContributor: Contributor = {
    //       userId: member.user.id,
    //       nickname: member.user.nickname ?? "",
    //       avatar: image,
    //     }

    //     // const newContributor: Contributor = {
    //     //   userId: member.user.id,
    //     //   nickname: member.user.nickname,
    //     //   avatar:  member.user.images.length != 0 ? member.user.images[0] : undefined,
    //     //   roleTags: member.tags
    //     // }
    //     contributor.push(newContributor)
    //   }
      
    // }
    //projectMembersData.map(x => contributor.push({userId: x.user.id, roleTags: x.tags}))

    // load cover
    const coverData = formData.get("cover") ? formData.get("cover") : null
    const cover: Image | null = await saveCover(coverData)
    var covers: Image[] = cover ? [cover] : []

    var tags: Tag[] = []
    const tagsJsonData = formData.get("tags")!.toString()
    if(tagsJsonData != undefined) tags = JSON.parse(tagsJsonData)

    //const devStage: DevelopmentStage = DevelopmentStage.idea // todo user tags for that
    const tagUidData = formData.get("developmentStatus")!.toString()
    console.log("tagUidData")
    console.log(tagUidData)
    const devStageTag = await tagService.getByUid(tagUidData)
    console.log("devStageTag")
    console.log(devStageTag)
    if(devStageTag != null) {
      const developmentStatus = await groupService.find("development status")
      var devStagesTags: TagData[] = GetGroupsTags(developmentStatus).map(x => x.packing())

      var asStageTagExist: TagData | null = null
      for(const tag of tags) {
        let asTagExist = devStagesTags.find(x => x.uid == tag.uid)
        if(asTagExist == undefined) continue
        asStageTagExist = tag
      }

      if(asStageTagExist != null) tags.find(x => x.uid != asStageTagExist!.uid)

      tags.push(devStageTag)
    }

    const isOpenForCollaboration : boolean
      = formData.get("isOpenForNewMembers") == 'on' ? true : false
    if(isOpenForCollaboration) {
      const colobarationTag = await tagService.getByName("Requires maintance")
      if(colobarationTag) tags.push(colobarationTag)
    }
      
    const projectService: IProjectService = getCatalog().projects()

    if(!id) {
      const writeProject: WriteProject = {
        title: title!,
        description: about,
        covers: [],
        tags: tags,
        contributors: contributor,
        links: links
      }
      const newProject = await projectService.add(writeProject)
      if (cover) await projectService.addCover(newProject.id, { ...cover, kind: "cover_profile" as CoverKind })
      redirectTo = `/project/${newProject.id}`
    }
    else {
      console.log("edit from!")
      await editProjectConfigForm(formState, formData) // simplse data
      if(coverData && (coverData as File).size != 0) await addCoverProjectConfigForm(formState, formData)

      const project = await projectService.getById(id)
      const currentTags = project!.tags
      // шукаємо різниці на рівні тегів. Якщо вони знайдені то вирішуємо котрі додати, а котрі видалити
      //const tagsJsonData: string | undefined = formData.get("tags") ? formData.get("tags")!.toString() : undefined


    // if(devStageTag != null) tags.push(devStageTag)

      if(tagsJsonData){
        //const tagsData: TagData[] = JSON.parse(tagsJsonData)

        // const groupService: IGroupService = getCatalog().groups()
        // const group = await groupService.find("development status")

        for(var sendedTag of tags) {
          var tagInCurrentsTags = currentTags.find(x => x.uid == sendedTag.uid)

          if(!tagInCurrentsTags) {
            const linkedTag = await tagService.getByUid(sendedTag.uid)
            if(!linkedTag) continue
            await projectService.linkTag(id, linkedTag)
          }

        }

        for(const currentTag of currentTags) {
          var tagInSendedTags = tags.find(x => x.uid == currentTag.uid)
          if(tagInSendedTags == undefined) {
            //const sendedTag = await tagService.getByUid(tagInSendedTags.uid)
            //if(!linkedTag) continue
            const tagToRemove = await tagService.getByUid(currentTag.uid)
            if(!tagToRemove) continue

            
            await projectService.unlinkTag(id, tagToRemove)
          }
        }

        //const devEthapTags = group[0].items.map(i => i.object as Tag)

        for(const formLink of links) {
          const asLinkExist = project!.links.find(x => x.url == formLink.url)
          if(!asLinkExist) await projectService.addHrefLink(project!.id, formLink)
        }

        for(var currentLink of project!.links) {
          const asLinkExist = links.find(x=>x.url == currentLink.url)
          if(!asLinkExist) await projectService.removeHrefLink(project!.id, currentLink.id!)
        }
        

        // links
        // var links: Link[] = []
        // const linksJsonData: string | null =  formData.get("links") ? formData.get("links")!.toString() : null
        // if(linksJsonData != undefined) links = JSON.parse(linksJsonData)
      }
      

    }

    

  } catch(error) {
    return fromErrorToFormState(error);
  }

  if (redirectTo) redirect(redirectTo)

  return {
    status: 'SUCCESS' as const,
    message: null,
    fieldErrors: {},
  }
}


export const editProjectConfigForm = async (formState: FormState, formData: FormData) => {
  console.log("Edit project formData")
  console.log(formData)

  try{
    await chackAccess(formData)
    const projectId = getId(formData)

    const titleData: string | undefined = formData.get("title") ? formData.get("title")!.toString() : undefined
    const aboutData: string | null | undefined = formData.get("about") ? formData.get("about")!.toString() : undefined

    const projectService: IProjectService = getCatalog().projects()
    const editProkect: EditProject = {
      title: titleData,
      description: aboutData
    }

    await projectService.edit(projectId!, editProkect)
  }
  catch(error) {
    return fromErrorToFormState(error);
  }
}

export const addLinkProjectConfigForm = async (formState: FormState, formData: FormData) => {
  try {
    await chackAccess(formData)
    const projectId = getId(formData)

    const projectService: IProjectService = getCatalog().projects()
    
    const linksData: string | undefined = formData.get("links") ? formData.get("links")!.toString() : undefined
    if(!linksData) throw Error("Lack of data")

    var links: Link[] = JSON.parse(linksData)
    for(var link of links){
      await projectService.addHrefLink(projectId!, link)
    }
  }
  catch(error) {
    return fromErrorToFormState(error);
  }
}

export const removeLinkProjectConfigForm = async (formState: FormState, formData: FormData) => {
  try {
    await chackAccess(formData)
    const projectId = getId(formData)

    const projectService: IProjectService = getCatalog().projects()

    const linksData: string | undefined = formData.get("links") ? formData.get("links")!.toString() : undefined
    if(!linksData) throw Error("Lack of data")

    var links: Link[] = JSON.parse(linksData)
    for(var link of links){
      if(!link.id) continue
      await projectService.removeHrefLink(projectId!, link.id)
    }
  }
  catch(error) {
    return fromErrorToFormState(error);
  }
}

export const addCoverProjectConfigForm = async (formState: FormState, formData: FormData) => {
  try {
    await chackAccess(formData)
    const projectId = getId(formData)

    const coverData: FormDataEntryValue | null | undefined = formData.get("cover") ? formData.get("cover") : undefined
    if(!coverData) throw Error("Lack of data")

    const cover = await saveCover(coverData)
    if(!cover) throw Error("Error saving image")


    const projectService: IProjectService = getCatalog().projects()
    await projectService.addCover(projectId!, { ...cover, kind: "cover_profile" as CoverKind })
  }
  catch(error) {
    return fromErrorToFormState(error);
  }
}

export const removeCoverProjectConfigForm = async (formState: FormState, formData: FormData) => {
  try {
    await chackAccess(formData)
    const projectId = getId(formData)

    const projectService: IProjectService = getCatalog().projects()
    projectService.setCover(projectId!, null)
  }
  catch(error) {
    return fromErrorToFormState(error);
  }
}

export const linkTagsToProject = async (formState: FormState, formData: FormData) => {
  try {
    await chackAccess(formData)
    const projectId = getId(formData)

    const tagsJsonData: string | undefined = formData.get("tags") ? formData.get("tags")!.toString() : undefined
    if(!tagsJsonData) throw Error("Lack of data")
    const tagsData: TagData[] = JSON.parse(tagsJsonData)

    var tags: Tag[] = []
    const tagService: ITagService = getCatalog().tags()
    for(var tagData of tagsData) {
      const tag = await tagService.getByUid(tagData.uid)
      if(tag) {
        tags.push(tag)
      }
      else {
        const writeTag: WriteTag = {
          name: tagData.name,
          description: tagData.description,
        }
        const newTag = await tagService.add(writeTag)
        tags.push(newTag)
      }
    }
    

    const projectService: IProjectService = getCatalog().projects()
    for(var tag of tags) {
      await projectService.linkTag(projectId!, tag)
    }
  }
  catch(error) {
    return fromErrorToFormState(error);
  }
}

export const removeTagProjectConfigForm = async (formState: FormState, formData: FormData) => {
  try {
    await chackAccess(formData)
    const projectId = getId(formData)

    const tagsJsonData: string | undefined = formData.get("tags") ? formData.get("tags")!.toString() : undefined
    if(!tagsJsonData) throw Error("Lack of data")
    const tagsData: TagData[] = JSON.parse(tagsJsonData)

    var tags: Tag[] = []
    const tagService: ITagService = getCatalog().tags()
    for(var tagData of tagsData) {
      const tag = await tagService.getByUid(tagData.uid)
      if(tag) {
        tags.push(tag)
      }
    }

    const projectService: IProjectService = getCatalog().projects()
    for(var tag of tags) {
      await projectService.unlinkTag(projectId!, tag)
    }
  }
  catch(error) {
    return fromErrorToFormState(error);
  }
}

// helpers
function getId(formData: FormData): string | null {
  const idData: string | null = formData.get("id") ? formData.get("id")!.toString() : null
  return idData
}

async function isHasAccess(projectId: string): Promise<boolean> {
  const session = await auth()
  if(!session) return false
  if(!session.user) return false

  const userId = session?.user?.id!

  return true
}

async function chackAccess(formData: FormData) {
  const projectId = getId(formData)
  if(!projectId) throw Error("ID required")
  if(await !isHasAccess(projectId)) throw Error("Access denied")
}

async function saveCover(cover: any): Promise<Image | null> {
  if (cover instanceof File && cover != null) {
    const buffer = Buffer.from(await cover.arrayBuffer());

    const crypto = require("crypto");
    let uuid = crypto.randomUUID();

    const parts = cover.name.split(".");
    const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : null;

    var catalog: string = "covers"
    var filename: string = uuid + "." + ext

    var path = await saveFileOnServer(buffer, catalog, filename)

    return {src: filename}
  }

  return null
}