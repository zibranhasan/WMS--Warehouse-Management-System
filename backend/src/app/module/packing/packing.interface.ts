export interface ICreatePackingTask {
    salesOrderId: string;
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
