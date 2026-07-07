import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
// 1. ДОБАВИЛИ: Инструмент для перенаправления на другую страницу
import { NavigationMixin } from 'lightning/navigation'; 

import getAccountDetails from '@salesforce/apex/ItemPurchaseController.getAccountDetails';
import getItems from '@salesforce/apex/ItemPurchaseController.getItems';
import checkIsManager from '@salesforce/apex/ItemPurchaseController.checkIsManager';
import createItem from '@salesforce/apex/ItemPurchaseController.createItem';
// 2. ДОБАВИЛИ: Метод оформления заказа из бэкенда
import checkout from '@salesforce/apex/ItemPurchaseController.checkout'; 

// 3. ИЗМЕНИЛИ: Обернули наш класс в NavigationMixin, чтобы работали редиректы
export default class ItemPurchaseTool extends NavigationMixin(LightningElement) {
    @api recordId;

    account;
    isManager = false;
    @track items = [];
    
    isCreateModalOpen = false;
    wiredItemsResult; 

    isDetailsModalOpen = false;
    selectedItemForDetails;
    
    // 4. ДОБАВИЛИ: Переменные для корзины
    isCartModalOpen = false;
    @track cartItems = []; 
    
    searchQuery = '';
    @track selectedTypes = [];
    @track selectedFamilies = [];

    typeOptions = [
        { label: 'Type 1', value: 'Type 1' },
        { label: 'Type 2', value: 'Type 2' },
        { label: 'Type 3', value: 'Type 3' },
        { label: 'Type 4', value: 'Type 4' }
    ];

    familyOptions = [
        { label: 'Family 1', value: 'Family 1' },
        { label: 'Family 2', value: 'Family 2' },
        { label: 'Family 3', value: 'Family 3' },
        { label: 'Family 4', value: 'Family 4' }
    ];

    @wire(getAccountDetails, { accountId: '$recordId' })
    wiredAccount({ error, data }) {
        if (data) {
            this.account = data;
        } else if (error) {
            console.error('Error fetching account:', error);
        }
    }

    @wire(checkIsManager)
    wiredIsManager({ error, data }) {
        if (data !== undefined) {
            this.isManager = data;
        } else if (error) {
            console.error('Error checking manager status:', error);
        }
    }

    get typeFilterString() {
        return this.selectedTypes.join(';');
    }

    get familyFilterString() {
        return this.selectedFamilies.join(';');
    }

    @wire(getItems, { 
        searchStr: '$searchQuery', 
        familyFilter: '$familyFilterString', 
        typeFilter: '$typeFilterString' 
    })
    wiredItems(result) {
        this.wiredItemsResult = result;
        const { error, data } = result;
        if (data) {
            this.items = data;
        } else if (error) {
            console.error('Error fetching items:', error);
            this.items = [];
        }
    }
    
    get itemsCount() {
        return this.items ? this.items.length : 0;
    }

    get itemsEmpty() {
        return this.itemsCount === 0;
    }

    handleSearch(event) {
        this.searchQuery = event.target.value;
    }

    handleFilterChange(event) {
        const filterName = event.target.name;
        if (filterName === 'Type') {
            this.selectedTypes = event.detail.value; 
        } else if (filterName === 'Family') {
            this.selectedFamilies = event.detail.value;
        }
    }

    handleCreateItem() {
        this.isCreateModalOpen = true;
    }

    handleCloseCreateModal() {
        this.isCreateModalOpen = false;
    }

    handleSaveNewItem(event) {
        const itemData = event.detail;

        createItem({
            name: itemData.name,
            description: itemData.description,
            family: itemData.family,
            type: itemData.type,
            price: itemData.price,
            availableQuantity: itemData.quantity
        })
        .then(() => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success!',
                    message: 'New item was created successfully. Image fetched from Unsplash!',
                    variant: 'success'
                })
            );
            this.isCreateModalOpen = false;
            return refreshApex(this.wiredItemsResult);
        })
        .catch((error) => {
            console.error('Error creating item:', error);
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error creating item',
                    message: error.body ? error.body.message : error.message,
                    variant: 'error'
                })
            );
        });
    }

    handleShowDetails(event) {
        this.selectedItemForDetails = event.detail; 
        this.isDetailsModalOpen = true; 
    }

    handleCloseDetailsModal() {
        this.isDetailsModalOpen = false;
        this.selectedItemForDetails = null;
    }


    handleOpenCart() {
        this.isCartModalOpen = true;
    }

    handleCloseCart() {
        this.isCartModalOpen = false;
    }

    handleAddToCart(event) {
        const item = event.detail;
        
        const existingItemIndex = this.cartItems.findIndex(ci => ci.itemId === item.Id);

        if (existingItemIndex !== -1) {
            let cartItem = this.cartItems[existingItemIndex];
            if (cartItem.quantity >= item.AvailableQuantity__c) {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Out of Stock',
                    message: 'You cannot add more of this item than is available on the warehouse.',
                    variant: 'warning'
                }));
                return;
            }
            cartItem.quantity += 1;
            cartItem.totalPrice = cartItem.quantity * cartItem.unitCost;
        } else {
            this.cartItems.push({
                itemId: item.Id,
                name: item.Name,
                unitCost: item.Price__c,
                quantity: 1,
                totalPrice: item.Price__c
            });
        }
        
        this.cartItems = [...this.cartItems];

        this.dispatchEvent(new ShowToastEvent({
            title: 'Added to Cart',
            message: `${item.Name} has been added to your cart.`,
            variant: 'success'
        }));
    }

    handleCheckoutProcess() {
        const cartJsonString = JSON.stringify(this.cartItems.map(item => ({
            itemId: item.itemId,
            quantity: item.quantity,
            unitCost: item.unitCost
        })));

        checkout({ accountId: this.recordId, cartJson: cartJsonString })
        .then((purchaseId) => {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success!',
                message: 'Checkout completed successfully.',
                variant: 'success'
            }));
            
            this.isCartModalOpen = false;
            this.cartItems = [];
            refreshApex(this.wiredItemsResult);

            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: purchaseId,
                    objectApiName: 'Purchase__c',
                    actionName: 'view'
                }
            });
        })
        .catch((error) => {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Checkout Error',
                message: error.body ? error.body.message : error.message,
                variant: 'error'
            }));
        });
    }
}