// Import our custom CSS
import '../scss/styles.scss'

// Import libraries
import * as bootstrap from 'bootstrap';
import { csvParse } from 'd3';
import * as echarts from 'echarts';

//--------------------- Cached variables ---------------------------//
let data;


//--------------------- Functions ---------------------------//
// Read and parse a CSV file and pass the parsed data
function getData() {
  return new Promise((resolve, reject) => {
    if (data) {
      // If the data is already cached, return it
      resolve(data);
    } else {
      let file = formFile.files[0];
      let fr = new FileReader();
      fr.onload = receivedText;
      fr.readAsText(file);

      function receivedText() {
        data = csvParse(fr.result);
        resolve(data);
      }

      fr.onerror = () => {
        reject(fr.error);
      };
    }
  });
}

// Create delete button
function createDelButton() {
  const checkboxGroup = document.getElementById("checkbox-group");
  const newDeleteButton = document.createElement("div");
  newDeleteButton.classList.add("p-1");
  newDeleteButton.innerHTML = `
      <button type="button" class="btn btn-danger rounded-pill" id="delete-btn">Delete</button>
      `;
  checkboxGroup.appendChild(newDeleteButton);
}

// Create buttons of column options
function newOption(option) {
  const checkboxGroup = document.getElementById("checkbox-group");
  const checkbox = document.getElementById(`checkbox-${option}`);
  if (!checkbox) {
    const newCheckbox = document.createElement("div");
    newCheckbox.classList.add("p-1");
    newCheckbox.innerHTML = `
            <input class="btn-check" type="checkbox" value="${option}" id="checkbox-${option}">
            <label class="btn btn-outline-primary rounded-pill" for="checkbox-${option}">${option}</label>
        `;
    checkboxGroup.insertBefore(newCheckbox, checkboxGroup.lastChild);
  }
}

// Delete button of column options
function delUnchecked() {
  const checkboxGroup = document.getElementById("checkbox-group");
  const checkboxesInput = checkboxGroup.querySelectorAll("input[type=checkbox]");
  for (let i = 0; i < checkboxesInput.length; i++) {
    if (!(checkboxesInput[i].checked)) {
      checkboxesInput[i].parentNode.remove();
    }
  }
}

// Create dropdown menu with columns names as options to choose from
function createDropdown() {
  const checkboxGroup = document.getElementById("checkbox-group");
  const checkbox = document.createElement("div");
  checkbox.classList.add("dropdown", "p-1");
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

// Generate the list items from the columns array
function generateList(columns) {
  if (!columns) return console.log('Columns parameter is null.');
  columns.forEach((option) => {
    const listItem = document.createElement('button');
    listItem.classList.add('list-group-item', 'list-group-item-action', 'd-flex', 'justify-content-between');
    listItem.textContent = option;
    dropdownList.appendChild(listItem);
  });
}

// Plot column
function plotColumn(column) {
  // Find the minimum and maximum values of the array
  const columnMin = Math.min(...column);
  const columnMax = Math.max(...column);

  // Calculate the y-axis limits with a 10% margin
  const margin = 0.1 * (columnMax - columnMin);
  const yMin = columnMin - margin;
  const yMax = columnMax + margin;

  // Init eChart plot
  var chartDom = document.getElementById('plot-area');
  var myChart = echarts.init(chartDom);
  var option;
  
  option = {
    xAxis: {
      type: 'category',
    },
    yAxis: {
      type: 'value', 
      min: yMin,
      max: yMax
    },
    series: [
      {
        data: column,
        type: 'line'
      }
    ]
  };
  
  // plot
  option && myChart.setOption(option);
}

//--------------------- Main ---------------------------//
const formFile = document.getElementById('file-selector');

// Read csv and get the data
formFile.addEventListener('change', function () {
  getData()
    .then((data) => {
      generateList(data.columns);
    })
    .catch((error) => {
      console.error(error);
    });
}, false);

// Create dropdown menu with columns names
createDropdown();
// Crete delete button
createDelButton();

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
  newOption(option);
});

// Add event listener to delete column option
const deleteButton = document.getElementById('delete-btn');
deleteButton.addEventListener('click', (event) => {
  delUnchecked();
});

// Plot selected columns
const checkboxGroup = document.getElementById("checkbox-group");
checkboxGroup.addEventListener('click', (event) => {
  const checkboxesInput = checkboxGroup.querySelectorAll("input[type=checkbox]");
  for (let i = 0; i < checkboxesInput.length; i++) {
    if (checkboxesInput[i].checked) {
      var col_name = checkboxesInput[i].value
      getData()
      .then((data) => {
        plotColumn(data.map(obj => obj[col_name]));
      })
      .catch((error) => {
        console.error(error);
      });
      break;
    }
  }
});