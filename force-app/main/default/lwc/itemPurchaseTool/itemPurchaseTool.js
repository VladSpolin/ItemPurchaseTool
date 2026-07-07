import { LightningElement, api, wire, track } from 'lwc';

import getAccountDetails from '@salesforce/apex/ItemPurchaseController.getAccountDetails';
import getItems from '@salesforce/apex/ItemPurchaseController.getItems';
import checkIsManager from '@salesforce/apex/ItemPurchaseController.checkIsManager';

export default class ItemPurchaseTool extends LightningElement {
    @api recordId;

    account;
    isManager = false;
    @track items = [];
    
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


    // Загружаем данные Аккаунта
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
    wiredItems({ error, data }) {
        if (data) {
            this.items = data;
        } else if (error) {
            console.error('Error fetching items:', error);
            this.items = [];
        }
    }

    
    // Подсчет количества товаров для отображения в фильтрах
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
            this.selectedTypes = event.detail.value; // event.detail.value содержит массив выбранных значений
        } else if (filterName === 'Family') {
            this.selectedFamilies = event.detail.value;
        }
    }

    handleCreateItem() {
        console.log('Тут мы будем открывать модальное окно создания товара');
    }

    handleOpenCart() {
        console.log('Тут мы будем открывать корзину');
    }

    handleShowDetails(event) {
        const selectedItem = event.detail;
        console.log('Показываем детали для товара: ', selectedItem.Name);
    }

    handleAddToCart(event) {
        const itemToAdd = event.detail;
        console.log('Добавляем в корзину товар: ', itemToAdd.Name);
    }
}