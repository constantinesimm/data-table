class DataTable extends HTMLElement {
	
	// helper static method create DOM elements
	static createElem(elementName, elementClass) {
		const element = document.createElement(elementName);
		if (elementClass) element.className = elementClass;
		
		return element;
	};
	
	constructor(columns = ['id', 'firstName', 'lastName', 'email', 'phone']) {
		super();
		this.attachShadow({ mode: 'open' });
		
		this.data = [];
		this.columns = this.getAttribute('columns') || columns;
	}
	
	// Called when the element is added to the DOM
	connectedCallback() {
		this.GETjson(this.getAttribute('data-url'))
			.then(response => {
				this.shadowRoot.appendChild(this.createComponentStyle());
				this.shadowRoot.appendChild(this.createComponent(this.columns, response));
				
				this.componentConnectedCallback(response, this.shadowRoot);
			})
			.catch(error => console.log(error));
	}
	
	// Called after element added to the DOM and setting async data
	componentConnectedCallback(jsonData, root) {
		this.data = jsonData;
		
		// handle search event
		root.querySelector('button').onclick = (event) => {
			const searchValue = root.querySelector('input').value;
			
			this.handleSearchInput(searchValue, root);
		};
		
		// handle click event
		root.querySelector('table').onclick = ({ target } = event) => {
			const opts = {
				asc: ['desc', /\▴/g, '▾'],
				desc: ['asc',/\▾/g, '▴']
			};
			const order = target.dataset.order;
			
			if (target.tagName === 'TD') this.handleRowClick(target, root);
			if (target.tagName === 'TH') {
				this.handleRowsSort(target, root);
				
				target.dataset.order = opts[order][0];
				target.innerHTML = target.innerHTML.replace(opts[order][1], opts[order][2])
			}
		};
	}
	
	/**
	 *  create shadowDOM element methods
	 */
	
	// create full component
	createComponent(cols, data) {
		const componentContainer = DataTable.createElem('div', 'wcdt-container');
		const expandedContainer = DataTable.createElem('div', 'wcdt-container__expanded');
		
		componentContainer.appendChild(this.createSearch());
		componentContainer.appendChild(this.createTable(cols, data));
		componentContainer.appendChild(expandedContainer);
		
		return componentContainer;
	}
	
	// create table search
	createSearch() {
		const container = DataTable.createElem('div', 'wcdt-container__search');
		const input = DataTable.createElem('input', 'wcdt-search__input');
		const button = DataTable.createElem('button', 'wcdt-search__submit');
		
		input.type = 'text';
		input.placeholder = 'Type search request...';
		
		button.innerHTML = 'Search';
		
		container.appendChild(input);
		container.appendChild(button);
		
		return container;
	}
	
	// create table tag with head and body. including data
	createTable(columns, data) {
		const container = DataTable.createElem('div', 'wcdt-container__table');
		const table = DataTable.createElem('table', 'wcdt-table');
		const tableHead = DataTable.createElem('thead', 'wcdt-table__head');
		const tableHeadRow = tableHead.insertRow(-1);
		tableHeadRow.className = 'wcdt-head__row';
		
		for (const column of columns) {
			const cell = DataTable.createElem('th');
			
			cell.dataset.field = column;
			cell.dataset.order = 'asc';
			cell.innerHTML = `${ column } ▴`;
			
			tableHeadRow.appendChild(cell);
		}
		
		table.appendChild(tableHead);
		table.appendChild(this.createTableBody(columns, data));
		
		container.appendChild(table);
		
		return container;
	}
	
	// create table body tag
	createTableBody(columns, data) {
		const tableBody = DataTable.createElem('tbody', 'wcdt-table__body');
		
		for (const row of data) {
			const tableBodyRow = tableBody.insertRow(-1);
			tableBodyRow.className = 'wcdt-body__row';
			tableBodyRow.setAttribute('data-index', data.indexOf(row));
			
			for (const column of columns) {
				const cell = DataTable.createElem('td', '');
				
				cell.innerHTML = row[column];
				tableBodyRow.appendChild(cell);
			}
		}
		
		return tableBody;
	}
	
	// create styles tag with rules
	createComponentStyle() {
		const style = DataTable.createElem('style');

		style.innerHTML = `
        .wcdt-container {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
        }
    
        .wcdt-container__search {
            width: 75%;
            margin: 10px auto;
            display: flex;
            justify-content: flex-end;
        }
    
        .wcdt-container__search > .wcdt-search__input {
            width: 33%;
            border-radius: 4px;
            border: 1px solid #dcdfe6;
            box-sizing: border-box;
            color: #606266;
            height: 25px;
            font-size: 14px;
        }
    
        .wcdt-search__input[type=text]:focus, .wcdt-search__input[type=text]:active {
            border: 1px solid #606266!important;
            background-color: unset!important;
        }
    
        .wcdt-search__submit {
            cursor: pointer;
        }
        
        .wcdt-container__table {
            display: flex;
            flex-direction: row;
            justify-content: center;
            width: 100%;
        }
    
        .wcdt-table {
            width: 75%;
            border-radius: 5px;
            border-spacing: 1px;
            border-collapse: collapse;
            box-shadow: 0 -5px 25px 0 rgba(0,0,0,.1), 0 5px 25px 0 rgba(0,0,0,.1);
        }

        .wcdt-head__row > th {
            padding: 10px 0 8px 0;
            background-color: #f2f2f2;
            cursor: pointer;
        }
    
        .wcdt-head__row th > span {
            margin-left: 5px;
        }

        .wcdt-body__row {
            line-height: 25px;
            border-bottom: 1px solid #d0cccc8a;
            cursor: pointer;
        }
    
        .wcdt-body__row > td {
            text-align: center;
        }
        
        .wcdt-container__expanded:not([data-open]){
            display:none;
        }
    
        .wcdt-container__expanded[data-open] {
            display: flex;
            justify-content: center;
            padding: 10px;
        }
    
        .wcdt-container__expanded > .card {
            width: 50%;
            padding: 0 15px;
            border-radius: 10px;
            box-shadow: 0 -5px 25px 0 rgba(0,0,0,.1), 0 5px 25px 0 rgba(0,0,0,.1);
        }
    
        .wcdt-container__expanded .card .card-body p > textarea {
            margin: 0px;
            width: 435px;
            height: 75px;
            overflow: hidden;
        }`;
		
		return style;
	}
	
	/**
	 * handle actions methods
	 * Click - row and head cell
	 * Input - search input element
	 */
	
	// handle table sort
	handleRowsSort(target, root) {
		// sort logic
		const compare = {
			asc: (a,b) => (a[col] > b[col]) ? 1 : ((b[col] > a[col]) ? -1 : 0),
			desc: (a,b) => (a[col] > b[col]) ? -1 : ((b[col] > a[col]) ? 1 : 0)
		};
		
		const col = target.dataset.field;           // head cell clicked
		const orderDir = target.dataset.order;      // get order direction
		const tbody = root.querySelector('tbody');  // get shadowDOM element
		
		// sorted array (copy of source data)
		const sortedData = this.data.slice().sort(compare[orderDir]);
		
		// replace table body with sorted array data
		tbody.parentNode.replaceChild(this.createTableBody(this.columns, sortedData), tbody)
	}
	
	// handle show extended data from row
	handleRowClick(target, root) {
		const template = (row) => `
        <div class="card">
            <div class="card-body">
                <h4>Выбран пользователь <b>${ row.firstName } ${ row.lastName }</b></h4>
                <p>Описание:<br><textarea>${ row.description }</textarea></p>
                <p>Адрес проживания: <b>${ row.address.streetAddress }</b></p>
                <p>Город: <b>${ row.address.city }</b></p>
                <p>Провинция/штат: <b>${ row.address.state }</b></p>
                <p>Индекс: <b>${ row.address.zip} </b></p>
            </div>
        </div>
        `;
		
		const extendedBlock = root.querySelector('.wcdt-container__expanded');
		const row = target.parentElement.dataset.index;
		
		// If current row is extended - hide block after second click on same row
		if (extendedBlock.dataset.open === row) extendedBlock.removeAttribute('data-open');
		else {
			
			//show block on row click
			extendedBlock.dataset.open = row;
			extendedBlock.innerHTML = template(this.data[row]);
		}
	}
	
	// handle table data search
	handleSearchInput(searchValue, root) {
		const rows = root.querySelectorAll('tbody > tr');
		let matched;
		
		for(let i = 0; i < rows.length; i++) {
			const cells = rows[i].querySelectorAll('td');
			
			for (let j = 0; j < cells.length; j++) {
				if (cells[j].innerHTML.toLowerCase().match(searchValue.toLowerCase())) matched = true;
			}
			
			if (matched) {
				rows[i].style.display = '';
				matched = false;
			} else rows[i].style.display = 'none';
		}
	}
	
	// fetch data from data-url attribute. Return Promise
	GETjson(uri) {
		return fetch(uri).then(response => response.json());
	}
}

// define component
window.customElements.define('data-table', DataTable);