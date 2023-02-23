// Import our custom CSS
import '../scss/styles.scss'

// Import libraries
import * as bootstrap from 'bootstrap';
import { csvParse } from 'd3';
import * as echarts from 'echarts';

//--------------------- Cached variables ---------------------------//
let data;
const chartCache = {};
const wPerc = 0.95; // echartDom width
const hPerc = 0.4; // echartDom height
const commonOption = {
  dataZoom: [{ type: 'inside', start: 0, end: 100 }],
  toolbox: {
    feature: {
      restore: { show: true, title: 'Restore' },
      dataView: {
        show: true,
        title: 'Data View',
        readOnly: true,
        lang: ['Data View', 'Close', 'Refresh'],
      },
      saveAsImage: { show: true, title: 'Save As Image', type: 'png' },
    },
  },
  grid: {
    left: '5%',
    right: '5%',
    bottom: '10%',
    top: '10%',
    containLabel: true
  },
} // echart common option


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
function plotColumn(column, col_name) {
  const plotArea = document.getElementById('plots-area');
  const cache = chartCache[col_name];
  
  if (cache) {
    plotArea.appendChild(cache);
  } else {
    const isNumerical = column.every(element => !isNaN(element));
    const columnMin = isNumerical ? Math.min(...column) : null;
    const columnMax = isNumerical ? Math.max(...column) : null;
    const margin = isNumerical ? 0.1 * (columnMax - columnMin) : null;
    const yMin = isNumerical ? columnMin - margin : null;
    const yMax = isNumerical ? columnMax + margin : null;
    
    let chartDom = document.getElementById('plot-' + col_name) || document.createElement('div');
    chartDom.classList.add('container-fluid', 'myChartContainer');
    chartDom.id = 'plot-' + col_name;
    chartDom.style.width = Math.round(wPerc * document.body.clientWidth) + 'px';
    chartDom.style.height = Math.round(hPerc * document.body.clientWidth) + 'px';

    const myChart = echarts.init(chartDom);
    const option = {
      xAxis: { type: 'category' },
      yAxis: { type: isNumerical ? 'value' : 'category', min: yMin, max: yMax },
      series: [
        { data: column, type: isNumerical ? 'line' : 'scatter' },
      ],
    };
    
    myChart.setOption(Object.assign({}, option, commonOption));
    plotArea.appendChild(chartDom);
  
    chartCache[col_name] = chartDom;
  }
}

// Delete column plot
function delPlot(col_name) {
  let chartDom = document.getElementById('plot-' + col_name);
  if (chartDom) { // check if chartDom is not null
    chartDom.remove();
  }
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
  checkboxesInput.forEach((checkbox) => {
    const col_name = checkbox.value;
    if (checkbox.checked) {
      getData()
        .then((data) => plotColumn(data.map(obj => obj[col_name]), col_name))
        .catch(console.error);
    }
    else {
      delPlot(col_name);
    }
  });
});

// Add event listener for window resize
window.addEventListener('resize', () => {
  // Loop through chartCache and resize each chart
  for (const col_name in chartCache) {
    const chartDom = chartCache[col_name];
    chartDom.style.width = Math.round(wPerc*document.body.clientWidth).toString() + 'px';
    chartDom.style.height = Math.round(hPerc*document.body.clientWidth).toString() + 'px';
    const myChart = echarts.getInstanceByDom(chartDom);
    myChart.resize();
    console.log(`Resize ${col_name}`)
  }
});