// Import our custom CSS
import '../scss/styles.scss';
import svars from '../scss/styles.scss';

// Import libraries
import * as bootstrap from 'bootstrap';
import { csvParse } from 'd3';
import * as echarts from 'echarts';

//--------------------- Cached variables ---------------------------//
let data;
let outData;
let SpPv = {};
let plottedColumns = [];
let cacheSelectedLabel = null;
let cachePlotArea = document.getElementById('plots-area');
cachePlotArea.classList.add('container-fluid');
let cacheChart = echarts.init(cachePlotArea);
const cacheWPerc = 0.95; // echartDom width
let cacheHPerc = 0.10; // echartDom height
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
    {}
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
let cacheLabelColors = {};
const cacheMyColors = svars.myColors.split(", ")

const breakpoints = {
  xs: window.matchMedia("(max-width: 575.98px)"),
  sm: window.matchMedia("(min-width: 576px) and (max-width: 767.98px)"),
  md: window.matchMedia("(min-width: 768px) and (max-width: 991.98px)"),
  lg: window.matchMedia("(min-width: 992px) and (max-width: 1199.98px)"),
  xl: window.matchMedia("(min-width: 1200px) and (max-width: 1399.98px)"),
  xxl: window.matchMedia("(min-width: 1400px)"),
};

//--------------------- Functions ---------------------------//
// update cacheHperc
function updateHPerc(breakpoint) {
  switch (breakpoint) {
    case "xs":
      cacheHPerc = 0.4;
      break;
    case "sm":
      cacheHPerc = 0.35;
      break;
    case "md":
      cacheHPerc = 0.25;
      break;
    case "lg":
      cacheHPerc = 0.2;
      break;
    case "xl":
      cacheHPerc = 0.15;
      break;
    case "xxl":
      cacheHPerc = 0.1;
      break;
    default:
      break;
  }
  console.log(`cacheHPerc is now ${cacheHPerc}`);
}

function initHPerc() {
  Object.keys(breakpoints).forEach((breakpoint) => {
    breakpoints[breakpoint].addEventListener("change", () => {
      if (breakpoints[breakpoint].matches) {
        updateHPerc(breakpoint);
      }
    });
  });

  Object.keys(breakpoints).forEach((breakpoint) => {
    if (breakpoints[breakpoint].matches) {
      updateHPerc(breakpoint);
    }
  });
}

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
    // update cacheLabelColors object
    const idx = Object.keys(cacheLabelColors).length % cacheMyColors.length;
    cacheLabelColors[option] = cacheMyColors[idx];
    // create button
    const newradio = document.createElement("div");
    newradio.classList.add("p-1");
    newradio.innerHTML = `
          <input type="radio" class="btn-check" name="btnradio" id="btnradio-${option}" autocomplete="off">
          <label class="btn btn-outline rounded-pill my-btn-${idx + 1}" for="btnradio-${option}">${option}</label>
        `;
    radioGroup.insertBefore(newradio, radioGroup.lastElementChild);
  }
}

// Handle label modal ok button
const labelModal = new bootstrap.Modal(document.getElementById("labelModal"));
function handleLabelModalSubmit() {
  const userInput = document.getElementById("labelTextInput").value;
  if (userInput.trim() !== '') {
    newLabelOption(userInput);
    // Hide the modal
    labelModal.hide();
  } else {
    // User did not enter any text
    alert("Please enter some text");
  }
}

// Delete button of column options (either all or only unchecked)
function delColOptions(all = false) {
  const checkboxGroup = document.getElementById("checkbox-group");
  const checkboxesInput = checkboxGroup.querySelectorAll("input[type=checkbox]:not(#SP)");
  for (let i = 0; i < checkboxesInput.length; i++) {
    if (!all ? !(checkboxesInput[i].checked) : true) {
      checkboxesInput[i].parentNode.remove();
    }
  }
}

// Clear uncheck columns options
function uncheckColOptions() {
  const checkboxGroup = document.getElementById("checkbox-group");
  const checkboxesInput = checkboxGroup.querySelectorAll("input[type=checkbox]:not(#SP)");
  checkboxesInput.forEach((checkbox) => {
    checkbox.checked = false;
  });
}

// update the check of columns options
function updateColOptions() {
  const checkboxGroup = document.getElementById("checkbox-group");
  const checkboxesInput = checkboxGroup.querySelectorAll("input[type=checkbox]:not(#SP)");
  checkboxesInput.forEach((checkbox) => {
    if (plottedColumns.includes(checkbox.value)) {
      checkbox.checked = true;
    } else {
      checkbox.checked = false;
    }
  });
}

// Delete button of label options
function delCheckedLabel() {
  const radioGroup = document.getElementById("radio-group");
  const radiosInput = radioGroup.querySelectorAll("input[type=radio]");
  const selectedRadio = document.querySelector('input[type="radio"]:checked');
  const selectedLabel = document.querySelector('label[for="' + selectedRadio.id + '"]');
  for (let i = 0; i < radiosInput.length; i++) {
    if ((radiosInput[i].checked)) {
      delete cacheLabelColors[selectedLabel];
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

// Generate modal columns list 
function generateModalList(columns) {
  const dropdownList = document.getElementById('modal-list');
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
function plotColumn(data, colName) {
  const colData = data.map(obj => obj[colName]);
  if (colData.every(item => typeof item === 'undefined')) {return};
  const isNumerical = colData.every(element => !isNaN(element));
  const columnMin = isNumerical ? Math.min(...colData) : null;
  const columnMax = isNumerical ? Math.max(...colData) : null;
  const margin = isNumerical ? 0.1 * (columnMax - columnMin) : null;
  const yMin = isNumerical ? columnMin - margin : null;
  const yMax = isNumerical ? columnMax + margin : null;
  if (SpPv.hasOwnProperty(colName)) {
    option.yAxis.forEach((obj, index) => {
      if (obj.name === SpPv[colName]["PV"]) {
        option.series.push({ name: colName, data: colData, type: 'line', xAxisIndex: index, yAxisIndex: index, lineStyle: {color: 'black'}, z: 0 });
      }
    });
  } else {
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
        obj.top = `${(numAxes + 1) * (newGridHeight + newGridTop + newGridBottom) + newGridHeight / 3}%`;
        obj.height = `${newGridHeight / 3}%`;
      }
    });
    option.xAxis.push({ type: 'category', gridIndex: numAxes });
    option.xAxis.forEach((obj, index) => {
      if (index !== numAxes) {
        obj.show = false;
      }
    })
    option.yAxis.push({
      name: colName, nameTextStyle: { align: 'left', verticalAlign: 'bottom' }, type: isNumerical ? 'value' : 'category',
      min: yMin?.toFixed(1), max: yMax?.toFixed(1), gridIndex: numAxes
    });
    option.series.push({ name: colName, data: colData, type: 'line', xAxisIndex: numAxes, yAxisIndex: numAxes });
  }
  cacheChart.clear();
  cacheChart.setOption(option);
  cacheChart.resize();
  plottedColumns.push(colName);
  updateColOptions();
  const isPv = !Object.values(SpPv).every(obj => obj.PV !== colName);
  if (isPv) {
    const Sp = Object.keys(SpPv).find(key => SpPv[key].PV === colName);
    const checkbox = document.getElementById(`checkbox-${Sp}`);
    if (checkbox.checked) {
      plotColumn(data, Sp);
    }
  }
}


// Delete column plot from shared plot
function delPlot(colName) {
  if (!plottedColumns.includes(colName)) {
    return
  }
  // Check if cacheChart is not empty.
  if (!Array.isArray(option.series) || option.series.length === 0) {
    console.log("cacheChart doesn't contain any plots");
    return;
  }
  // Use some() method to check if colName exists in any of the objects in yAxis array.
  const isColNameInYAxis = option.yAxis.some(obj => obj.name === colName);
  if (!isColNameInYAxis && !SpPv.hasOwnProperty(colName)) {
    console.log(`${colName} not found in yAxis array`);
    return;
  }
  console.log(option.series)
  console.log(colName)
  const seriesIdx = option.series.findIndex(obj => obj.name === colName);
  console.log(seriesIdx)
  if (seriesIdx === -1) { return };
  if (SpPv.hasOwnProperty(colName)) {
      option.series.splice(seriesIdx, 1);
  }
  else {
    const isPv = !Object.values(SpPv).every(obj => obj.PV !== colName);
    if (isPv) {
      console.log("This a PV column")
      const Sp = Object.keys(SpPv).find(key => SpPv[key].PV === colName);
      console.log(`SP: ${Sp}`)
      delPlot(Sp);
    }
    // change the grid index for plots with indices greater than idx
    const xAxisIdx = option.xAxis.findIndex(obj => obj.name === colName);
    const yAxisIdx = option.yAxis.findIndex(obj => obj.name === colName);
    const seriesIdx = option.series.findIndex(obj => obj.name === colName);
    console.log([xAxisIdx, yAxisIdx, seriesIdx])
    option.yAxis.forEach((obj) => { if (obj.gridIndex > yAxisIdx) { obj.gridIndex -= 1 } });
    option.series.forEach((obj) => { if (obj.yAxisIndex > yAxisIdx) { obj.xAxisIndex -= 1; obj.yAxisIndex -= 1 } });
    // delete plot
    option.xAxis.splice(xAxisIdx, 1);
    option.yAxis.splice(yAxisIdx, 1);
    option.series.splice(seriesIdx, 1);
    option.grid.splice(yAxisIdx, 1);
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
        obj.height = `${newGridHeight / 3}%`;
      }
    });
    cachePlotArea.style.height = `${(numAxes + 1) * Math.round(cacheHPerc * document.body.clientWidth)}px`;
  }
  console.log(option)
  console.log(SpPv)
  cacheChart.clear();
  cacheChart.setOption(option);
  cacheChart.resize();
  plottedColumns = plottedColumns.filter(function(element){
    return element !== colName;
  });
  updateColOptions();
  console.log(option.xAxis.length)
}

// Plot selected columns
function plotSelectedCols() {
  const checkboxGroup = document.getElementById("checkbox-group");
  checkboxGroup.addEventListener('click', (event) => {
    const checkbox = event.target;
    const colName = checkbox.value;
    if (checkbox.checked === true) {
      getData()
        .then((data) => plotColumn(data, colName))
        .catch(console.error);
    } else if (checkbox.checked === false) {
      delPlot(colName);
    }
  });
}

// Mark label area
function markLabelArea(label, coordRange) {
  const labelArray = new Array(coordRange[1] - coordRange[0]).fill(label);
  outData.splice(coordRange[0], coordRange[1] - coordRange[0], ...labelArray);
  console.log(outData);
  if (option.series.length > 0) {
    if (option.series[0].markArea) {
      option.series[0].markArea.data.push([{ xAxis: coordRange[0], itemStyle: { color: cacheLabelColors[label], opacity: 0.5 } }, { xAxis: coordRange[1] }])
    } else {
      option.series[0].markArea = {
        data: [[{ xAxis: coordRange[0], itemStyle: { color: cacheLabelColors[label], opacity: 0.5 } }, { xAxis: coordRange[1] }]]
      };
    }
    cacheChart.setOption(option);
  }
}

//--------------------- Main ---------------------------//
initHPerc();

// Read csv and get the data
const formFile = document.getElementById('file-selector');
formFile.addEventListener('change', function () {
  getData(true)
    .then((data) => {
      outData = new Array(data.length).fill(null);;
      generateList(data.columns);
      generateModalList(data.columns);
      cacheChart.clear();
      option = JSON.parse(JSON.stringify(initOption));
      cacheChart.setOption(initOption);
      uncheckColOptions();
      plottedColumns = [];
      // delColOptions(true);
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

// SP modal
// 1
const columnModal = new bootstrap.Modal(document.getElementById("columnModal"));
let selectedColumn;
let clickedColumn;
dropdownList.addEventListener('click', (event) => {
  const clickedButton = event.target.closest('.list-group-item');
  const checkbox = document.getElementById("SP");
  selectedColumn = clickedButton.textContent;
  if (checkbox.checked) {
    columnModal.show();
    checkbox.checked = false;
  } else {
    newColOption(selectedColumn);
  }
});
// 2
const modalList = document.getElementById('modal-list');
modalList.addEventListener('click', (event) => {
  const erroBound = document.getElementById("error-bound-input").value;
  clickedColumn = event.target.closest('.list-group-item');
  if (clickedColumn.classList.contains("active")) {
    clickedColumn.classList.remove("active");
  } else {
    console.log("Button active");
    clickedColumn.classList.add("active");
    const column = clickedColumn.textContent;
    SpPv[selectedColumn] = {"PV": column, error: erroBound};
  }
});
// 3
const okButton = document.getElementById('column-modal-ok-btn');
okButton.addEventListener('click', () => {
  columnModal.hide();
  newColOption(selectedColumn);
  if (clickedColumn) {
    clickedColumn.classList.remove("active");
  }
});


// Add event listener to delete column option
const deleteColButton = document.getElementById('del-column-btn');
deleteColButton.addEventListener('click', () => {
  delColOptions();
});

// Add event listener to modal ok button
const addLabelButton = document.getElementById('label-modal-ok-btn');
addLabelButton.addEventListener('click', () => {
  handleLabelModalSubmit();
});

// Add event listener to delete label option
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
plotSelectedCols();

// Resize the chart when the window is resized
window.addEventListener('resize', function () {
  const numAxes = option.xAxis.length;
  initHPerc();
  cachePlotArea.style.width = `${Math.round(cacheWPerc * document.body.clientWidth)}px`;
  cachePlotArea.style.height = `${(numAxes + 1) * Math.round(cacheHPerc * document.body.clientWidth)}px`;
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