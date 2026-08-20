export interface ISalesOrderItemInput {
    productId: string;
    quantity: number;
    unitPrice: number;
}

export interface ICreateSalesOrder {
    warehouseId: string;
    items: ISalesOrderItemInput[];
    notes?: string | null;
}

export interface ICancelSalesOrder {
    cancellationReason: string;
}
