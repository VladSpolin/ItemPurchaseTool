import { LightningElement, api, wire, track } from 'lwc';
// ДОБАВИЛИ: стандартные утилиты Salesforce для уведомлений и сброса кэша
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

import getAccountDetails from '@salesforce/apex/ItemPurchaseController.getAccountDetails';
import getItems from '@salesforce/apex/ItemPurchaseController.getItems';
import checkIsManager from '@salesforce/apex/ItemPurchaseController.checkIsManager';
// ДОБАВИЛИ: импорт метода создания товара из Apex
import createItem from '@salesforce/apex/ItemPurchaseController.createItem';

export default class ItemPurchaseTool extends LightningElement {
    @api recordId;

    account;
    isManager = false;
    @track items = [];
    
    // ДОБАВИЛИ: переменные для контроля модалки и хранения результата wire
    isCreateModalOpen = false;
    wiredItemsResult; 
    
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

    // ИЗМЕНИЛИ: теперь принимаем 'result' целиком, чтобы работал refreshApex
    @wire(getItems, { 
        searchStr: '$searchQuery', 
        familyFilter: '$familyFilterString', 
        typeFilter: '$typeFilterString' 
    })
    wiredItems(result) {
        this.wiredItemsResult = result; // Сохраняем объект для сброса кэша
        const { error, data } = result; // Деструктурируем внутри
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
            this.selectedTypes = event.detail.value; 
        } else if (filterName === 'Family') {
            this.selectedFamilies = event.detail.value;
        }
    }

    // ИЗМЕНИЛИ: теперь метод открывает модальное окно
    handleCreateItem() {
        this.isCreateModalOpen = true;
    }

    // ДОБАВИЛИ: метод закрытия модального окна без сохранения
    handleCloseCreateModal() {
        this.isCreateModalOpen = false;
    }

    // ДОБАВИЛИ: метод сохранения нового товара
    handleSaveNewItem(event) {
        const itemData = event.detail;

        // Вызываем Apex-метод императивно и передаем ему поля из модалки
        createItem({
            name: itemData.name,
            description: itemData.description,
            family: itemData.family,
            type: itemData.type,
            price: itemData.price,
            availableQuantity: itemData.quantity
        })
        .then(() => {
            // Показываем зеленый Toast об успехе
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success!',
                    message: 'New item was created successfully. Image fetched from Unsplash!',
                    variant: 'success'
                })
            );
            this.isCreateModalOpen = false; // Закрываем окно
            return refreshApex(this.wiredItemsResult); // Обновляем список товаров на экране
        })
        .catch((error) => {
            console.error('Error creating item:', error);
            // Показываем красный Toast в случае ошибки
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error creating item',
                    message: error.body ? error.body.message : error.message,
                    variant: 'error'
                })
            );
        });
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