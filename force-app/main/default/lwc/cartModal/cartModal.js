import { LightningElement, api } from 'lwc';

export default class CartModal extends LightningElement {
    @api cartItems = [];

    get isCartEmpty() {
        return !this.cartItems || this.cartItems.length === 0;
    }

    get grandTotal() {
        if (this.isCartEmpty) return 0;
        return this.cartItems.reduce((total, item) => total + item.totalPrice, 0);
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleCheckout() {
        this.dispatchEvent(new CustomEvent('checkout'));
    }
}