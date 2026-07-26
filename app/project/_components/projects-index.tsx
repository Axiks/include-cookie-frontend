import { Box, Container, Heading, Section, Text, Flex, Grid } from "@radix-ui/themes";
import ProjectCard from "./project-card";
import { IProjectService, Project } from "@/lib/shared/project/project.service.interface";

export default async function ProjectsIndex({projects}: {projects: Project[]}) {
    return (
        <Grid mt="4" columns="1" gap="3" width="auto">
            { projects.map((project) => (
                // <Text key={project.id}>{project.id}</Text>
                <ProjectCard key={project.id} title={project.title ?? ""} description={project.synopsis ?? ""} author={project.contributor.length != 0 ? project.contributor[0] : null} link={"/project/"+project.id} tags={project.tags} />
            )) }
        </Grid>
    );
}