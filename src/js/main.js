// Import our custom CSS
import '../scss/styles.scss'

// Import all of Bootstrap's JS
import * as bootstrap from 'bootstrap'

// Import d3
import { csvParse } from 'd3';

//--------------------- Functions ---------------------------//
// Read and parse a CSV file and pass the parsed data to a custom callback function
function getData(callback) {
    let file = formFile.files[0];
    let fr = new FileReader();
    fr.onload = receivedText;
    fr.readAsText(file);

    function receivedText() {
        const data = csvParse(fr.result);
        callback(data.columns);
    }
}

// Create buttons for column options
function addOption(option) {
    const checkboxGroup = document.getElementById("checkbox-group");    
    const deleteCheckbox = document.getElementById('checkbox-del');
    if (!deleteCheckbox) {
        const newDeleteCheckbox = document.createElement("div");
        newDeleteCheckbox.classList.add("p-1");
        newDeleteCheckbox.innerHTML = `
        <input class="btn-check" type="checkbox" id="checkbox-del">
        <label class="btn btn-danger rounded-pill" for="checkbox-del">Delete</label>
        `;
        checkboxGroup.appendChild(newDeleteCheckbox);
    } 

    const checkbox =  document.getElementById(`checkbox-${option}`);
    if (!checkbox) {
        console.log(option)
        const newCheckbox = document.createElement("div");
        newCheckbox.classList.add("p-1");
        newCheckbox.innerHTML = `
            <input class="btn-check" type="checkbox" value="${option}" id="checkbox-${option}">
            <label class="btn btn-outline-primary rounded-pill" for="checkbox-${option}">${option}</label>
        `;
        checkboxGroup.insertBefore(newCheckbox, checkboxGroup.lastChild);
    }
}

// Create dropdown menu with columns names as options to choose from
function createDropdown() {
    const checkboxGroup = document.getElementById("checkbox-group");
    const checkbox = document.createElement("div");
    checkbox.classList.add("dropdown");
    checkbox.innerHTML += `
    <button class="btn btn-success dropdown-toggle rounded-pill" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
    Add
    </button>
    <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
        <div>
        <span id="search-addon"><i class="bi bi-search"></i></span>
        <input type="text" class="form-control" placeholder="Search" aria-label="Search" aria-describedby="search-addon" id="search-input">
        </div>
        <ul class="list-group" id="dropdown-list" style="max-height: 300px; overflow-y: auto;">
        <!-- List items will be dynamically generated from JavaScript -->
        </ul>
    </div>
    `;
    checkboxGroup.appendChild(checkbox);
}

// Filter the list items based on the search query
function filterList() {
    const query = searchInput.value.toLowerCase();
    const items = dropdownList.getElementsByTagName('button');
    Array.from(items).forEach((item) => {
        const text = item.textContent.toLowerCase();
        const match = text.includes(query);
        item.style.display = match ? 'list-item' : 'none';
    });
}

// Generate the list items from the input array
function generateList(columns) {
    if (!columns) return console.log('Columns parameter is null.');
    columns.forEach((option) => {
        const listItem = document.createElement('button');
        listItem.classList.add('list-group-item', 'list-group-item-action', 'd-flex', 'justify-content-between');
        listItem.textContent = option;
        dropdownList.appendChild(listItem);
    });
}


//--------------------- Main ---------------------------//
const formFile = document.getElementById('file-selector');

// Read csv and get the data
formFile.addEventListener('change', function () {
    getData(generateList);
}, false);

// Create dropdown menu with columns names
createDropdown();

// Add search to the dropdown menu
const searchInput = document.getElementById('search-input');
const dropdownList = document.getElementById('dropdown-list');
// Add event listeners to update the filtered list as the user types
searchInput.addEventListener('input', filterList);
document.addEventListener('click', (event) => {
    if (!dropdownList.contains(event.target)) {
        searchInput.value = '';
        filterList();
    }
});

// Add event listener to update optionsList
dropdownList.addEventListener('click', (event) => {
    const clickedButton = event.target.closest('.list-group-item');
    const option = clickedButton.textContent;
    addOption(option);
});