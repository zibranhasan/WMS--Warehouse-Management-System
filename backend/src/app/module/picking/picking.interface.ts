export interface ICreatePickingTask {
    salesOrderId: string;
}

export interface IAssignPicker {
    assignedToId: string;
}

export interface IPickItemUnit {
    pickingTaskItemId: string;
    locationStockId: string;
    quantity: number;
}

export interface IPickItems {
    items: IPickItemUnit[];
}
