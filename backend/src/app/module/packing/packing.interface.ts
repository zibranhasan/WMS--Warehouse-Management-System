export interface ICreatePackingTask {
    salesOrderId: string;
}

export interface IAssignPacker {
    assignedToId: string;
}

export interface ICreatePackage {
    weight?: number;
    notes?: string;
}

export interface IAddPackageItemUnit {
    packingTaskItemId: string;
    quantity: number;
}

export interface IAddPackageItems {
    items: IAddPackageItemUnit[];
}

export interface ICancelPackingTask {
    cancellationReason: string;
}
