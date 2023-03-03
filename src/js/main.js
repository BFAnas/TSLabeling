// Import our custom CSS
import '../scss/styles.scss'

// Import libraries
import * as bootstrap from 'bootstrap';
import { csvParse } from 'd3';
import * as echarts from 'echarts';

//--------------------- Cached variables ---------------------------//
let data;
let cacheSelectedLabel = null;
let cachePlotArea = document.getElementById('plots-area');
cachePlotArea.classList.add('container-fluid');
let cacheChart = echarts.init(cachePlotArea);
const cacheWPerc = 0.95; // echartDom width
const cacheHPerc = 0.2; // echartDom height
let cacheGrid = {
  left: '5%',
  right: '2%',
  top: '20%',
  height: '70%',
  bottom: '10%'
};
let initOption = {
  xAxis: [],
  yAxis: [],
  series: [],
  dataZoom: [
    { type: 'inside', realtime: true }, 
    { }
  ],
  grid: [{
    left: '5%',
    right: '2%',
    top: '20%',
    height: '70%',
    bottom: '10%'
  }],
  toolbox: {
    right: '2%',
    feature: {
      dataView: { show: true, title: 'Data View', readOnly: true, lang: ['Data View', 'Close', 'Refresh'] },
      saveAsImage: { show: true, title: 'Save As Image', type: 'png' },
      dataZoom: { yAxisIndex: 'none' },
      brush: {
        type: ['lineX', 'clear']
      }
    },
  },
  tooltip: { trigger: 'axis', axisPointer: { animation: false } },
  axisPointer: { link: [{ xAxisIndex: 'all' }] },
  brush: {
    xAxisIndex: 0,
  },
};
let option = JSON.parse(JSON.stringify(initOption));
cacheChart.setOption(option);
const colorPalette = ['#c23531','#2f4554','#61a0a8','#d48265','#91c7ae','#749f83','#ca8622','#bda29a','#6e7074','#546570','#c4ccd3'];


//--------------------- Functions ---------------------------//
// Read and parse a CSV file and pass the parsed data
function getData(read = false) {
  return new Promise((resolve, reject) => {
    if (data && !read) {
      // If the data is already cached, return it
      console.log("Returning cached Data");
      resolve(data);
    } else {
      console.log("Reading Data");
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

// Create buttons of column options
function newColOption(option) {
  const checkboxGroup = document.getElementById("checkbox-group");
  const checkbox = document.getElementById(`checkbox-${option}`);
  if (!checkbox) {
    const newCheckbox = document.createElement("div");
    newCheckbox.classList.add("p-1");
    newCheckbox.innerHTML = `
            <input class="btn-check" type="checkbox" value="${option}" id="checkbox-${option}">
            <label class="btn btn-outline-primary rounded-pill" for="checkbox-${option}">${option}</label>
        `;
    checkboxGroup.insertBefore(newCheckbox, checkboxGroup.lastElementChild);
  }
}

// Create buttons of label options
function newLabelOption(option) {
  const radioGroup = document.getElementById("radio-group");
  const radio = document.getElementById(`btnradio-${option}`);
  if (!radio) {
    const newradio = document.createElement("div");
    newradio.classList.add("p-1");
    newradio.innerHTML = `
          <input type="radio" class="btn-check" name="btnradio" id="btnradio-${option}" autocomplete="off">
          <label class="btn btn-outline-primary rounded-pill" for="btnradio-${option}">${option}</label>
        `;
    radioGroup.insertBefore(newradio, radioGroup.lastElementChild);
  }
}

// Handle modal ok button
const myModal = new bootstrap.Modal(document.getElementById("myModal"));
function handleModalSubmit() {
  const userInput = document.getElementById("labelTextInput").value;
  if (userInput.trim() !== '') {
    newLabelOption(userInput);
    // Hide the modal
    myModal.hide();
  } else {
    // User did not enter any text
    alert("Please enter some text");
  }
}

// Delete button of column options (either all or only unchecked)
function delColOptions(all = false) {
  const checkboxGroup = document.getElementById("checkbox-group");
  const checkboxesInput = checkboxGroup.querySelectorAll("input[type=checkbox]");
  for (let i = 0; i < checkboxesInput.length; i++) {
    if (!all? !(checkboxesInput[i].checked) : true) {
      checkboxesInput[i].parentNode.remove();
    }
  }
}

// Delete button of label options
function delCheckedLabel() {
  const radioGroup = document.getElementById("radio-group");
  const radiosInput = radioGroup.querySelectorAll("input[type=radio]");
  for (let i = 0; i < radiosInput.length; i++) {
    if ((radiosInput[i].checked)) {
      radiosInput[i].parentNode.remove();
    }
  }
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
  dropdownList.innerHTML = "";
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
  cachePlotArea.style.width = `${Math.round(cacheWPerc * document.body.clientWidth)}px`;
  cachePlotArea.style.height = `${(numAxes + 2) * Math.round(cacheHPerc * document.body.clientWidth)}px`;
  const newGridHeight = parseInt(cacheGrid.height) / (numAxes + 2);
  const newGridTop = parseInt(cacheGrid.top) / (numAxes + 2);
  const newGridBottom = parseInt(cacheGrid.bottom) / (numAxes + 2);
  option.grid.push(Object.assign({}, cacheGrid));
  option.grid.forEach((obj, index) => {
    obj.height = `${newGridHeight}%`;
    obj.top = `${newGridTop + index * (newGridHeight + newGridTop + newGridBottom)}%`;
    obj.bottom = `${newGridBottom + (numAxes - index) * (newGridHeight + newGridTop + newGridBottom)}%`;
  });
  option.dataZoom.forEach((obj, index) => { 
    obj.xAxisIndex = Array.from({ length: numAxes + 1 }, (_, i) => i);
    if (index === 1) {
      obj.top = `${(numAxes + 1) * (newGridHeight + newGridTop + newGridBottom)}%`;
      obj.height = `${newGridHeight/3}%`;
    }
  });
  option.xAxis.push({ type: 'category', gridIndex: numAxes });
  option.yAxis.push({
    name: colName, nameTextStyle: { align: 'left' }, type: isNumerical ? 'value' : 'category',
    min: yMin?.toFixed(1), max: yMax?.toFixed(1), gridIndex: numAxes 
  });
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
  option.xAxis.forEach((obj, index) => { if (index > idx) { obj.gridIndex -= 1 } });
  option.yAxis.forEach((obj, index) => { if (index > idx) { obj.gridIndex -= 1 } });
  option.series.forEach((obj, index) => { if (index > idx) { obj.xAxisIndex -= 1; obj.yAxisIndex -= 1 } });
  // delete plot
  option.xAxis.splice(idx, 1);
  option.yAxis.splice(idx, 1);
  option.series.splice(idx, 1);
  option.grid.splice(idx, 1);
  const numAxes = option.xAxis.length;
  const newGridHeight = parseInt(cacheGrid.height) / (numAxes + 1);
  const newGridTop = parseInt(cacheGrid.top) / (numAxes + 1);
  const newGridBottom = parseInt(cacheGrid.bottom) / (numAxes + 1);
  option.grid.forEach((obj, index) => {
    obj.height = `${newGridHeight}%`;
    obj.top = `${newGridTop + index * (newGridHeight + newGridTop + newGridBottom)}%`;
    obj.bottom = `${newGridBottom + (numAxes - index) * (newGridHeight + newGridTop)}%`;
  });
  option.dataZoom.forEach((obj, index) => { 
    obj.xAxisIndex = Array.from({ length: numAxes + 1 }, (_, i) => i);
    if (index === 1) {
      obj.top = `${numAxes * (newGridHeight + newGridTop + newGridBottom)}%`;
      obj.height = `${newGridHeight/3}%`;
    }
  });
  cacheChart.clear();
  cacheChart.setOption(option);
  cachePlotArea.style.height = `${(numAxes + 1) * Math.round(cacheHPerc * document.body.clientWidth)}px`;
  cacheChart.resize();
}

// Mark label area
function markLabelArea(label, coordRange) {
  if (option.series.length > 0) {
    option.series[0].markArea = {
      data: [[{ name: label, xAxis: coordRange[0], itemStyle: { color : label === 'Label 1'? 'rgba(255, 173, 177, 0.4)' : 'rgba(10, 255, 26, 0.4)' } }, { xAxis: coordRange[1] }]]
    };
    cacheChart.setOption(option);
  }
  }

//--------------------- Main ---------------------------//
// Read csv and get the data
const formFile = document.getElementById('file-selector');
formFile.addEventListener('change', function () {
  getData(true)
    .then((data) => {
      generateList(data.columns);
      cacheChart.clear();
      option = JSON.parse(JSON.stringify(initOption));
      cacheChart.setOption(initOption);
      delColOptions(true);
    })
    .catch((error) => {
      console.error(error);
    });
}, false);

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
  newColOption(option);
});

// Add event listener to delete column option
const deleteColButton = document.getElementById('del-column-btn');
deleteColButton.addEventListener('click', () => {
  delColOptions();
});

// Add event listener to modal ok button
const addLabelButton = document.getElementById('modal-ok-btn');
addLabelButton.addEventListener('click', () => {
  handleModalSubmit();
});

// Add event listener to delete column option
const deleteLabelButton = document.getElementById('del-label-btn');
deleteLabelButton.addEventListener('click', () => {
  delCheckedLabel();
  cacheSelectedLabel = null;
});

// Update selected label
const radioGroup = document.getElementById("radio-group");
radioGroup.addEventListener('click', (event) => {
  if (event.target.id.includes('btnradio'))
  cacheSelectedLabel = event.target.id;
})

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
window.addEventListener('resize', function () {
  const numAxes = option.xAxis.length;
  cachePlotArea.style.width = `${Math.round(cacheWPerc * document.body.clientWidth)}px`;
  cachePlotArea.style.height = `${numAxes * Math.round(cacheHPerc * document.body.clientWidth)}px`;
  cacheChart.resize();
});

// Get selected data using brush
cacheChart.on('brushEnd', function (params) {
  if (params.areas.length > 0) {
    var coordRange = params.areas[0].coordRange;
    let label;
    if (cacheSelectedLabel !== null) {
      label = cacheSelectedLabel.split("-")[1];
      markLabelArea(label, coordRange);
    }
  }
});
