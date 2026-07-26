import Image from "@/lib/shared/cdn/_types/Image";
import { DevelopmentStage } from "../_enums/development-stage.enum";
import { Link } from "@/lib/shared";

export type ProjectData = {
    id: string,
    title: string;
    description: string;
    covers: Array<Image>;
    links: Array<Link>;
    developmentStage: DevelopmentStage;
}
