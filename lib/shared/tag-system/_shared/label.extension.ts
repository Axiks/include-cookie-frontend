export interface ILabelExtensionForRepository {
    linkLabel(uid: string, label: Label): Promise<void>;
    unlinkLabel(uid: string, label: Label): Promise<void>;
    // getLables(id: string): Promise<Label[]>;
}

export interface ILabelExtensionForService {
    linkLabel(uid: string, label: Label): Promise<void>;
    unlinkLabel(uid: string, label: Label): Promise<void>;
    // getLables(id: string): Promise<Label[]>;
}

export type Label = {
    name: string
}

export type LabelTypeExtension = {
    lables: Label[]
}

export type WriteLabelTypeExtension = {
    lables?: Label[] | null
}