// Import our custom CSS
import '../scss/styles.scss'

// Import libraries
import * as bootstrap from 'bootstrap';
import { csvParse } from 'd3';
import * as echarts from 'echarts';

//--------------------- Cached variables ---------------------------//
let data;
let cachePlotArea = document.getElementById('plots-area');
cachePlotArea.classList.add('container-fluid');
let cacheChart = echarts.init(cachePlotArea);
const cacheWPerc = 0.95; // echartDom width
const cacheHPerc = 0.3; // echartDom height
const cacheGrid = {
  left: '10%',
  right: '5%',
  top: '15%',
  height: '70%',
  bottom: '10%'
};
const option = {
  xAxis: [],
  yAxis: [],
  series: [],
  dataZoom: [
    { type: 'inside', realtime: true, start: 30, end:70 },
    { start: 30, end:70 },
  ],
  toolbox: {
    feature: {
      restore: { show: true, title: 'Restore' },
      dataView: { show: true, title: 'Data View', readOnly: true, lang: ['Data View', 'Close', 'Refresh'] },
      saveAsImage: { show: true, title: 'Save As Image', type: 'png' },
      dataZoom: { yAxisIndex: 'none' }
    }
  },
  tooltip: { trigger: 'axis', axisPointer: { animation: false } },
  axisPointer: { link: [{ xAxisIndex: 'all' }] }
};
cacheChart.setOption(option);


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
    item.style.display = match ? item.classList.remove('d-none') : item.classList.add('d-none');
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

// Plot column in shared chart
function plotColumn(colData, colName) {
  const isNumerical = colData.every(element => !isNaN(element));
  const columnMin = isNumerical ? Math.min(...colData) : null;
  const columnMax = isNumerical ? Math.max(...colData) : null;
  const margin = isNumerical ? 0.1 * (columnMax - columnMin) : null;
  const yMin = isNumerical ? columnMin - margin : null;
  const yMax = isNumerical ? columnMax + margin : null;
  const numAxes = option.xAxis.length;
  const isEmptySeries = !Array.isArray(option.series) || option.series.length === 0;
  if (isEmptySeries) {
    cachePlotArea.style.width = `${Math.round(cacheWPerc * document.body.clientWidth)}px`;
    option.grid = [Object.assign({}, cacheGrid)];
  } else {
    const newGridHeight = Math.round(parseInt(cacheGrid.height) / (numAxes + 1));
    const newGridTop = Math.round(parseInt(cacheGrid.top) / (numAxes + 1));
    const newGridBottom = Math.round(parseInt(cacheGrid.bottom) / (numAxes + 1));
    option.grid.push(Object.assign({}, cacheGrid));
    option.grid.forEach((obj, index) => {
      obj.height = `${newGridHeight}%`;
      obj.top = `${newGridTop + index * (newGridHeight + newGridTop + newGridBottom)}%`;
      obj.bottom = `${newGridBottom + (numAxes - index) * (newGridHeight + newGridTop + newGridBottom)}%`;
    });
  }
  cachePlotArea.style.height = `${(numAxes + 1) * Math.round(cacheHPerc * document.body.clientWidth)}px`;
  option.dataZoom.forEach(obj => obj.xAxisIndex = Array.from({ length: numAxes + 1 }, (_, i) => i));
  option.xAxis.push({ type: 'category', gridIndex: numAxes });
  option.yAxis.push({ name: colName, type: isNumerical ? 'value' : 'category', min: yMin, max: yMax, gridIndex: numAxes });
  option.series.push({ name: colName, data: colData, type: 'line', xAxisIndex: numAxes, yAxisIndex: numAxes });
  cacheChart.clear();
  cacheChart.setOption(option);
  cacheChart.resize();
}


// Delete column plot from shared plot
function delPlot(colName) {
  // Check if cacheChart is not empty.
  if (!Array.isArray(option.series) || option.series.length === 0) {
    console.log("cacheChart doesn't contain any plots");
    return;
  }
  // Use some() method to check if colName exists in any of the objects in yAxis array.
  const isColNameInYAxis = option.yAxis.some(obj => obj.name === colName);
  if (!isColNameInYAxis) {
    console.log(`${colName} not found in yAxis array`);
    return;
  }
  const idx = option.yAxis.findIndex(obj => obj.name === colName);
  // change the grid index for plots with indices greater than idx
  option.xAxis.forEach((obj, index) => {if (index > idx) {obj.gridIndex -= 1}});
  option.yAxis.forEach((obj, index) => {if (index > idx) {obj.gridIndex -= 1}});
  option.series.forEach((obj, index) => {if (index > idx) {obj.xAxisIndex -= 1; obj.yAxisIndex -= 1}});
  // delete plot
  option.xAxis.splice(idx, 1);
  option.yAxis.splice(idx, 1);
  option.series.splice(idx, 1);
  option.grid.splice(idx, 1);
  const numAxes = option.xAxis.length;
  if (numAxes > 0) {
    const newGridHeight = Math.round(parseInt(cacheGrid.height) / numAxes);
    const newGridTop = Math.round(parseInt(cacheGrid.top) / numAxes);
    const newGridBottom = Math.round(parseInt(cacheGrid.bottom) / numAxes);
    option.grid.forEach((obj, index) => {
      obj.height = `${newGridHeight}%`;
      obj.top = `${newGridTop + index * (newGridHeight + newGridTop + newGridBottom)}%`;
      obj.bottom = `${newGridBottom + (numAxes - index) * (newGridHeight + newGridTop + newGridBottom)}%`;
    });
  } else {
    option.grid = Object.assign({}, cacheGrid);
  }
  cacheChart.clear();
  cacheChart.setOption(option);
  cachePlotArea.style.height = `${numAxes * Math.round(cacheHPerc * document.body.clientWidth)}px`;
  console.log(cachePlotArea.style.height);
  cacheChart.resize();
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
  var option = clickedButton.textContent;
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
  const checkbox = event.target;
  const colName = checkbox.value;
  if (checkbox.checked === true) {
    console.log(`${colName} checkbox checked ${checkbox.checked}`);
    getData()
      .then((data) => plotColumn(data.map(obj => obj[colName]), colName))
      .catch(console.error);
  } else if (checkbox.checked === false) {
    console.log(`${colName} checkbox checked ${checkbox.checked}`);
    delPlot(colName);
  }
});

// Resize the chart when the window is resized
window.addEventListener('resize', function() {
  const numAxes = option.xAxis.length;
  cachePlotArea.style.width = `${Math.round(cacheWPerc * document.body.clientWidth)}px`;
  cachePlotArea.style.height = `${numAxes * Math.round(cacheHPerc * document.body.clientWidth)}px`;
  cacheChart.resize();
});