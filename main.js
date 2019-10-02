//Load external navbar.html
includeHTML();

//Send request after pressing the return key
document.querySelector("#name").addEventListener("keyup", event => {
  event.preventDefault(); // No need to `return false;`.
  if (event.key !== "Enter") return;
  fetchGeoJson();
});

function fetchGeoJson() {
  //Clean all HTML sections from previous results or errors
  document.getElementById("heading1").innerHTML = "";
  document.getElementById("heading2").innerHTML = "";
  document.getElementById("overview-table").innerHTML = "";
  document.getElementById("heading3").innerHTML = "";
  document.getElementById("infotext").innerHTML = "";
  document.getElementById("mapshapes").innerHTML = "";
  document.getElementById("infotext").innerHTML = "";
  //Show wait cursor and GIF while the JSON is being loaded
  document.body.style.cursor = "wait";
  document.getElementById("heading1").innerHTML = '<img src="img/giphy.gif" alt="Loading..." style="width:32px;height:auto;">';

  var name = document.getElementById("name").value;

  //Exit function, if nothing has been entered & print error message.
  if (!name) {
    outputError("Please enter something in the name field.");
    return;
  }

  //Make sure, that name is found even if first letter is not a capital letter, e.g. "name"~"[hH]oltorf". Add $ sign to make sure that it doesn't find "Parish hall", if we search for Paris.
  name = "^[" + name[0].toUpperCase() + name[0].toLowerCase() + "]" + name.slice(1) + "$";
  console.log("Name: " + name);

  //Find out which radio button is selected and forward this number to "adminLevel"
  var radios = document.getElementsByName("admin_level");
  var adminLevel;
  for (var i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      adminLevel = radios[i].value;
      break;
    }
  }

  var data = '[out:json][timeout:240];area[~"^name"~"' + name + '"]->.search;(rel(area.search)[admin_level=' + adminLevel + '][wikidata=""];);out tags;';
  console.log("Paste this code to overpass turbo to debug: " + data);

  //Convert whitespaces and special chars to %xx
  var dataUri = encodeURIComponent(data.trim());
  //console.log("Data with URI encoding: " +dataUri);

  //Create url for API request
  var url = "https://overpass-api.de/api/interpreter?data=" + dataUri;
  //console.log(url);

  fetch(url)
    .then(handleErrors)
    .then(function (response) {
      return response.json();
    })
    .then(function (overpassJson) {
      //If the response is empty print a message
      if (overpassJson.elements.length != 0) {
        createMapshapes(overpassJson);
      } else {
        outputError("The request returned no results!");
      }
    }).catch(function (error) {
      outputError(error);
    });
}

function handleErrors(response) {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
}

//Show error message
function outputError(message) {
  //Change cursor back to standard
  document.body.style.cursor = "auto";

  document.getElementById("heading1").innerHTML = "<h2>An error has occured</h2>"; //Replace loading animation with "Error"
  document.getElementById("heading2").innerHTML = "";
  document.getElementById("overview-table").innerHTML = "";
  document.getElementById("heading3").innerHTML = "";
  document.getElementById("infotext").innerHTML = message;
  document.getElementById("mapshapes").innerHTML = "";
}

function createMapshapes(overpassJson) {
  //Create mapshapes
  var mapshape = "{{Mapframe|width=500|height=500|group=map1}}\r\n";
  for (var i = 0; i < overpassJson.elements.length; i++) {
    var wikidata = overpassJson.elements[i].tags.wikidata;
    var name = defineName(overpassJson, i);
    var randColor = ("000000" + Math.random().toString(16).slice(2, 8).toUpperCase()).slice(-6);//source: https://www.paulirish.com/2009/random-hex-color-code-snippets/
    mapshape = mapshape + "{{Mapshape|type=geoshape|wikidata=" + wikidata + "|group=map1|fill=#" + randColor + "|title=" + name + " - " + wikidata + "}}\r\n";
  }
  var outputTextarea = "<textarea id=textareabox cols=110 rows=30>" + mapshape + "</textarea>";

  //Create overview table
  var table = "<table>";
  table += "<thead>";
  table += "<tr>";
  table += "<th align=left>Name</th>";
  table += "<th align=left>Wikidata-ID</th>";
  table += "</tr>";
  table += "</thead>";
  table += "<tbody>";

  for (var i = 0; i < overpassJson.elements.length; i++) {
    var wikidata = overpassJson.elements[i].tags.wikidata;
    var name = defineName(overpassJson, i);
    table += "<tr>";
    table += ("<td>" + name + "</td>");
    table += ("<td>" + wikidata + "</td>");
  }

  table += "</tr>";
  table += "</tbody>";
  table += "</table";

  //Write to html
  document.getElementById("heading1").innerHTML = "<h2>Result</h2>";
  document.getElementById("heading2").innerHTML = "<h3>Overview Table</h3>";
  document.getElementById("overview-table").innerHTML = table;
  document.getElementById("heading3").innerHTML = "<h3>Mapshapes</h3>";
  document.getElementById("infotext").innerHTML = "<details><summary>Hints</summary>In case of <i>Couldn't parse JSON: Syntax error</i>, when pasting in Wikivoyage:<ul><li>Check, if any of the Mapshapes below have the tag <i>wikidata</i> set to <i>undefined</i>. This means, that the Wikidata-ID has yet to be defined in OSM</li><li>Check if there are quotation marks in the title of any district. They are not allowed!</li></ul></details>";
  document.getElementById("mapshapes").innerHTML = outputTextarea;
  //Change cursor back to standard
  document.body.style.cursor = "auto";
}

function defineName(overpassJson, i) {
  //use english name, if available. Else use the normal "name" tag. Dot/bracket notation used due to colon (https://stackoverflow.com/q/4925760/5263954)
  if (typeof overpassJson.elements[i].tags['name:en'] == 'undefined') {
    return overpassJson.elements[i].tags.name;
  } else {
    return overpassJson.elements[i].tags['name:en'];
  }
}

//Code to load the external navbar.html
function includeHTML() {
  var z, i, elmnt, file, xhttp;
  /* Loop through a collection of all HTML elements: */
  z = document.getElementsByTagName("*");
  for (i = 0; i < z.length; i++) {
    elmnt = z[i];
    /*search for elements with a certain atrribute:*/
    file = elmnt.getAttribute("w3-include-html");
    if (file) {
      /* Make an HTTP request using the attribute value as the file name: */
      xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
          if (this.status == 200) { elmnt.innerHTML = this.responseText; }
          if (this.status == 404) { elmnt.innerHTML = "Page not found."; }
          /* Remove the attribute, and call this function once more: */
          elmnt.removeAttribute("w3-include-html");
          includeHTML();
        }
      }
      xhttp.open("GET", file, true);
      xhttp.send();
      /* Exit the function: */
      return;
    }
  }
}