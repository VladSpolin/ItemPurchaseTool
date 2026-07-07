import { LightningElement, api } from 'lwc';

export default class ItemCreateModal extends LightningElement {
    @api typeOptions = [];
    @api familyOptions = [];

    name = '';
    description = '';
    type = '';
    family = '';
    price;
    quantity;

    handleChange(event) {
        const fieldName = event.target.name;
        this[fieldName] = event.target.value;
    }

    handleCancel() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleSave() {
        const isInputsCorrect = [...this.template.querySelectorAll('lightning-input', 'lightning-combobox')]
            .reduce((validSoFar, inputField) => {
                inputField.reportValidity();
                return validSoFar && inputField.checkValidity();
            }, true);

        if (isInputsCorrect) {
            this.dispatchEvent(new CustomEvent('save', {
                detail: {
                    name: this.name,
                    description: this.description,
                    type: this.type,
                    family: this.family,
                    price: this.price,
                    quantity: this.quantity
                }
            }));
        }
    }
}