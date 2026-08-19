export interface IPurchaseOrderItemInput {
    productId: string;
    orderedQuantity: number;
    unitPrice: number;
}

export interface ICreatePurchaseOrder {
    supplierId: string;
    warehouseId: string;
    notes?: string;
    items: IPurchaseOrderItemInput[];
}

export interface IUpdatePurchaseOrder {
    supplierId?: string;
    warehouseId?: string;
    notes?: string;
    items?: IPurchaseOrderItemInput[];
}

export interface IRejectPurchaseOrder {
    rejectionReason?: string;
}

export interface ICancelPurchaseOrder {
    cancellationReason?: string;
}

export interface IReceiveItemInput {
    productId: string;
    receivedQuantity?: number;
    quantity?: number;
    Quantity?: number;
}

export interface IReceiveGoods {
    items: IReceiveItemInput[];
    reason?: string;
    reference?: string;
}
