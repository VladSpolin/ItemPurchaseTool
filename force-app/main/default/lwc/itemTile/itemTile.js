import { LightningElement, api } from 'lwc';

export default class ItemTile extends LightningElement {
    @api item;

    get isOutOfStock() {
        return this.item.AvailableQuantity__c <= 0;
    }

    handleDetails() {
        this.dispatchEvent(new CustomEvent('showdetails', {
            detail: this.item
        }));
    }

    handleAdd() {
        this.dispatchEvent(new CustomEvent('addtocart', {
            detail: this.item
        }));
    }
}