export interface IAllocateStock {
    warehouseId: string;
    binId: string;
    productId: string;
    quantity: number;
    reason?: string;
    reference?: string;
}

export interface IDeallocateStock {
    warehouseId: string;
    binId: string;
    productId: string;
    quantity: number;
    reason?: string;
    reference?: string;
}

export interface ITransferStock {
    warehouseId: string;
    productId: string;
    fromBinId: string;
    toBinId: string;
    quantity: number;
    reason?: string;
    reference?: string;
}
