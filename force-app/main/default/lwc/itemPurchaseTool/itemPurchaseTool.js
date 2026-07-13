import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation'; 

import getAccountDetails from '@salesforce/apex/ItemPurchaseController.getAccountDetails';
import getItems from '@salesforce/apex/ItemPurchaseController.getItems';
import checkIsManager from '@salesforce/apex/ItemPurchaseController.checkIsManager';
import createItem from '@salesforce/apex/ItemPurchaseController.createItem';
import checkout from '@salesforce/apex/ItemPurchaseController.checkout'; 

export default class ItemPurchaseTool extends NavigationMixin(LightningElement) {
    @api recordId;

    account;
    isManager = false;
    @track items = [];
    
    isCreateModalOpen = false;
    isDetailsModalOpen = false;
    selectedItemForDetails;
    
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

    connectedCallback() {
        this.loadAccountDetails();
        this.loadManagerStatus();
        this.loadItems();
    }

    get typeFilterString() {
        return this.selectedTypes.join(';');
    }

    get familyFilterString() {
        return this.selectedFamilies.join(';');
    }

    get itemsCount() {
        return this.items ? this.items.length : 0;
    }

    get itemsEmpty() {
        return this.itemsCount === 0;
    }

    loadAccountDetails() {
        getAccountDetails({ accountId: this.recordId })
            .then(data => {
                this.account = data;
            })
            .catch(error => {
                console.error('Error fetching account:', error);
            });
    }

    loadManagerStatus() {
        checkIsManager()
            .then(data => {
                this.isManager = data !== undefined ? data : false;
            })
            .catch(error => {
                console.error('Error checking manager status:', error);
            });
    }

    loadItems() {
        getItems({ 
            searchStr: this.searchQuery, 
            familyFilter: this.familyFilterString, 
            typeFilter: this.typeFilterString 
        })
        .then(data => {
            this.items = data;
        })
        .catch(error => {
            console.error('Error fetching items imperatively:', error);
            this.items = [];
        });
    }

    handleSearch(event) {
        this.searchQuery = event.target.value;
        this.loadItems(); // Живой поиск: обновляем данные при каждом вводе
    }

    handleFilterChange(event) {
        const filterName = event.target.name;
        if (filterName === 'Type') {
            this.selectedTypes = event.detail.value; 
        } else if (filterName === 'Family') {
            this.selectedFamilies = event.detail.value;
        }
        this.loadItems(); // Живые фильтры: обновляем данные при клике по чекбоксам
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
            this.loadItems(); // Автоматический перезапрос свежей витрины с картинкой
        })
        .catch(error => {
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

        checkout({ accountId: this.recordId, cartItemsJson: cartJsonString })
        .then((purchaseId) => {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success!',
                message: 'Checkout completed successfully.',
                variant: 'success'
            }));
            
            this.isCartModalOpen = false;
            this.cartItems = [];
            this.loadItems(); 

            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: purchaseId,
                    objectApiName: 'Purchase__c',
                    actionName: 'view'
                }
            });
        })
        .catch(error => {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Checkout Error',
                message: error.body ? error.body.message : error.message,
                variant: 'error'
            }));
        });
    }
}