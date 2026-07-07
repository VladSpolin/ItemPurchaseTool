import { LightningElement, api } from 'lwc';

export default class ItemDetailsModal extends LightningElement {
    @api item; 

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }
}