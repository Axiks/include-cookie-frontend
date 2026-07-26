// import { getLastCommit } from "git-last-commit";

export const hash = process.env.GIT_COMMIT ?? (await getCommitHash());
//export const commitHash = process.env.GIT_COMMIT ?? "none";

async function getCommitHash(): Promise<String> {
  // return new Promise((resolve, reject) => {

  //   getLastCommit((err, commit) => {

  //     if (err) return reject(err);
  //     resolve(commit.shortHash);

  //   });

  // });
  return "AAAAAa"
}

import { remark } from 'remark';
import html from 'remark-html';

async function convertMarkdownToHtml(markdown: string): Promise<string> {
  
  // Use remark to convert markdown into HTML string
  // const processedContent = await remark() 
  //   .use(html)
  //   .process(matterResult.content);
  // const contentHtml = processedContent.toString();

  return ""
}