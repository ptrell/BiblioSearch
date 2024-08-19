//const { MendeleySDK } = require("./mendeley-sdk/standalone.min");

const searchFormId = "search-form";
const searchButtonId = "search-bar__search-button";
const advancedSearchOptionListId = "advanced-search__list";
const searchBarTextInputId = "search-bar__text-input"
const searchMethodSelectId = "search-bar__method-select";
const searchLimitSelectId = "search-bar__limit-select";
const resultsNumberSelectId = "results-number-input";

const titleInputId = "title-input";
const abstractInputId = "abstract-input";
const authorInputId = "author-input";
const sourceInputId = "source-input";
const minYearInputId = "min-year";
const maxYearInputId = "max-year";
const pubTypeInputId = "type-input";

const titleFilterId = "title-filter";
const authorFilterId = "author-filter";
const sourceFilterId = "source-filter";
const minYearFilterId = "min-year-filter";
const maxYearFilterId = "max-year-filter";
const pubTypeFilterId = "type-filter";
const resultsPerPageId = "results-per-page";

const paginationListId = "pagination-list";

const mendeleyParams = ["title", "author", "source", "abstract", "min_year", "max_year", "max_year", "open_access"];

const dictTypesMendeleytoBIB = {
		journal:"article",
		book:"book",
		generic:"misc",
		book_section:"inbook",
		conference_proceedings:"proceedings",
		working_paper:"techreport",
		report:"techreport",
		web_page:"misc",
		thesis:"masterthesis",
		magazine:"article",
		statute:"misc",
		patent:"misc",
		newspaper_article:"article",
		computer_program:"misc",
		hearing:"misc",
		television_broadcast:"misc",
		encyclopedia_article:"article",
		case:"misc",
		film:"misc",
		bill:"misc"
}

var previousMethodIndex;
var previousSearchURL;
var currentSearchMethod;
var fetchedResults;
var usableResults;

let mendeleyAPI;

function initialize(){

	mendeleyAPI = new MendeleySDK({
	  authFlow: MendeleySDK.Auth.implicitGrantFlow({
	    clientId: 18861
	  })
	});
	
	let searchParams = new URL(document.location.toString()).searchParams;
	if(searchParams.size == 0){
		document.getElementById("results-elements").style.display="none";
		populateSelectedResults();
		return;
	}

	searchQuery = searchParams.get("query");
	searchTitle = searchParams.get("title");
	searchAuthor = searchParams.get("author");
	searchSource = searchParams.get("source");
	searchAbstract = searchParams.get("abstract");
	searchMinYear = searchParams.get("min_year");
	searchMaxYear = searchParams.get("max_year");
	searchLimit = searchParams.get("limit");
	//searchOpenAccess = searchParams.get("open_access");
	
	let mendeleyUriArgs = {
		limit: encodeURIComponent(searchLimit),
		query: encodeURIComponent(searchQuery),
		title: encodeURIComponent(searchTitle),
		author: encodeURIComponent(searchAuthor),
		source: encodeURIComponent(searchSource),
		abstract: encodeURIComponent(searchAbstract),
		min_year: (searchMinYear),
		max_year: (searchMaxYear),
		//open_access: ""searchParams.get("open_access"),
		view: "bib"
	};
	
	let searchMethod = searchParams.get("method");
	let searchTerm = searchParams.get("search");
	/*let searchTitle = searchParams.get("title");
	let searchSource = searchParams.get("source");
	let searchAbstract = searchParams.get("abstract");
	let desiredResults = searchParams.get("number");*/
	
	if(searchTerm==""){
		document.getElementById("results-elements").style.display="none";
		populateSelectedResults();
		return;
	}
	
	//sessionStorage.setItem("BiblioSearch-User_Selection-Mendeley", JSON.stringify(selectionData));
	
	else{
		populateSelectedResults();
		
		document.getElementById(searchBarTextInputId).value=searchQuery;
		document.getElementById(titleInputId).value=searchTitle;
		document.getElementById(abstractInputId).value=searchAbstract;
		document.getElementById(authorInputId).value=searchAuthor;
		document.getElementById(sourceInputId).value=searchSource;
		document.getElementById(minYearInputId).value=searchMinYear;
		document.getElementById(maxYearInputId).value=searchMaxYear;
		let limitSelect = document.getElementById(searchLimitSelectId);
		selectOptionByValue(limitSelect, searchLimit);
		
		obtainResultsMendeley(mendeleyUriArgs);
	}
	
};

function convertMendeleyJSONtoBibTeX(item){
	console.log(item);
	let bib = {
		citationKey:"Mendeley:"+item.type+"/"+item.id,
		entryTags:{
			author: "",
			bibsource: "Mendeley",
			biburl: item.link,
			title: item.title,
			year: item.year
		},
		entryType:dictTypesMendeleytoBIB[item.type]
	};

	console.log(bib);

	switch (bib.entryType){
		case "article":
			bib.entryTags["journal"]=item.source;
			break;
			
		case "book":
			bib.entryTags["publisher"]=item.source;
			break;
		
		case "inbook":
			bib.entryTags["publisher"]=item.source;
			break;
			
		case "masterthesis":
			bib.entryTags["school"]=item.source;
			break;
			
		case "techreport":
			bib.entryTags["institution"]=item.source;
			break;	

		case "misc":
			bib.entryTags["source"]=item.source;
			break;	
	};

	console.log(bib);

	for(let i = 0; i < item.authors.length; i++){
		bib.entryTags["author"] += item.authors[i]["first_name"] + " " + item.authors[i]["last_name"];
		if(i < item.authors.length-1){
			bib.entryTags["author"] += "and ";
		}
	}

	console.log(bib);

return bib;
	
}

function isDOMElement(obj) {
	  try {
	    //Using W3 DOM2 (works for FF, Opera and Chrome)
	    return obj instanceof HTMLElement;
	  }
	  catch(e){
	    //Browsers not supporting W3 DOM2 don't have HTMLElement and
	    //an exception is thrown and we end up here. Testing some
	    //properties that all elements have (works on IE7)
	    return (typeof obj==="object") &&
	      (obj.nodeType===1) && (typeof obj.style === "object") &&
	      (typeof obj.ownerDocument ==="object");
	  }
	}
	
function isXML(elem) {
    // documentElement is verified for cases where it doesn't yet exist
    // (such as loading iframes in IE - #4833) 
    var documentElement = (elem ? elem.ownerDocument || elem : 0).documentElement;

    return documentElement ? documentElement.nodeName !== "HTML" : false;
}

function selectOptionByValue(selectElement, value){
	for (let i = 0; i<selectElement.options.length; i++){
		if(selectElement.options[i].getAttribute("value")==value){
			selectElement.options.selectedIndex = i;
		}
	}
}

async function obtainResultsMendeley(uriArgs){
    JsLoadingOverlay.show();
    //try{
		let data="";
		let parser = new DOMParser();
		
		//process the retreived results to obtain the list of article items
		fetchedResults = [];
		//let searchMethod = document.getElementById(searchMethodSelectId).selectedOptions[0].value;

		let usableArgs = Object.fromEntries(Object.entries(uriArgs).filter(([_, v]) => v != null && v != ""));
	console.log(usableArgs);
		mendeleyAPI.search
		    .catalog(usableArgs)
		    .then(function (data){
			usableResults = data.items;
			fetchedResults = data.items;
			if(usableResults.length==0){
				createResultErrorMessage("No results were found for the current search terms.")
    				JsLoadingOverlay.hide();
				return;
			}
			console.log(usableResults);
			JsLoadingOverlay.hide();
			populateResultsMendeley(1);
		    })
		    .catch((error) => {
			console.log(error);
			usableResults=[];
			createResultErrorMessage("No results were found for the current search terms.")
    			JsLoadingOverlay.hide();
			return;
		     });
/*	}
    catch(error){
    	//console.log(error);
    	//currentSearchMethod = document.getElementById(searchMethodSelectId).selectedOptions[0].value;
    	usableResults=[];
    	createResultErrorMessage("No results were found for the current search terms.")
    	JsLoadingOverlay.hide();
    }*/
}

function receiveResultsMendeley(data){
	console.log(data);
}

function populateResultsMendeley(pageNumber){
	JsLoadingOverlay.show();
	try{
		let filteredResults = usableResults;
		let resultsPerPage = parseInt(document.getElementById(resultsPerPageId).selectedOptions[0].value);
		let maxPage = Math.ceil(filteredResults.length/resultsPerPage);
		populatePaginationBar(pageNumber, maxPage);
		let resultList = document.getElementById("results__result-list");
		let index = ((pageNumber-1)*resultsPerPage);
		let frag = document.createDocumentFragment();
		frag.innerHTML = "";
		let maxIndex = Math.min((index + resultsPerPage), filteredResults.length);
			
		for(let i = index; i < maxIndex; i++){
			//using document fragments because adding elements to them and then adding the fragment to the father element as a child is faster than adding all of them into the live page one by one
			frag.innerHTML+=createResultItem(filteredResults[i]);
		}
			
		resultList.innerHTML = frag.innerHTML;
		let resultsOnScreen = resultList.getElementsByClassName("result-item");
		for(let i = index; i < maxIndex; i++){
			//attaching the result object data to the list item
			attachJQData(resultsOnScreen[i%resultsOnScreen.length], "result", filteredResults[i]);
		}
	}
	catch(error){
		
	}
	finally{
		JsLoadingOverlay.hide();
	}
	
	
}

function createResultErrorMessage(msg){
	populatePaginationBar(1, 1);
	let resultList = document.getElementById("results__result-list");
	let errorElement = (`<li class="result-item">
			<span class="result-item__options">
		</span>
	
	<span class="result-item__title-span">
		<a class="result-item__title">`
		+ msg +
		`</a>
	</span>
	
	<span class="result-item__options--right">
	</span>
	
</li>`);
	resultList.innerHTML = errorElement;
}

function createResultItem(result){
	
	let yearValue = result.year;
	if(yearValue == undefined){yearValue="Unknown Year";}
	
	let sourceValue = result.source;
	if(sourceValue == undefined){sourceValue="";}
	
	let typeValue = result.type;
	if(typeValue == undefined){typeValue="";}

	let urlValue = result.link;
	if(urlValue == undefined){urlValue="";}

	let nameValue = result.title;
	if(nameValue == undefined){nameValue="<<No Title Found for This Article>>";}
	
	return(`<li class="result-item">
			<span class="result-item__options">
			<div class="btn-group dropleft">
			  <button type="button" class="result-item__download-button icon-button btn-secondary" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
			    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
						<path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
						<path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
				</svg>
			  </button>
			  
			  <div class="dropdown-menu">
			  	<h6 class="dropdown-header">Download</h6>
			  	<div class="dropdown-divider"></div>
      			    <button class="download-button__download-option dropdown-item" value="json" type="button">JSON</button>
			    <button class="download-button__download-option dropdown-item" value="bib" type="button">BibTeX</button>
			  </div>
			  
			</div>
			
			<div class="btn-group dropleft">
			  <button type="button" class="result-item__display-button icon-button btn-secondary" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
				  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-display" viewBox="0 0 16 16">
					  <path d="M0 4s0-2 2-2h12s2 0 2 2v6s0 2-2 2h-4q0 1 .25 1.5H11a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1h.75Q6 13 6 12H2s-2 0-2-2zm1.398-.855a.76.76 0 0 0-.254.302A1.5 1.5 0 0 0 1 4.01V10c0 .325.078.502.145.602q.105.156.302.254a1.5 1.5 0 0 0 .538.143L2.01 11H14c.325 0 .502-.078.602-.145a.76.76 0 0 0 .254-.302 1.5 1.5 0 0 0 .143-.538L15 9.99V4c0-.325-.078-.502-.145-.602a.76.76 0 0 0-.302-.254A1.5 1.5 0 0 0 13.99 3H2c-.325 0-.502.078-.602.145"/>
				  </svg>
			  </button>
			  
			  <div class="dropdown-menu">
			  <h6 class="dropdown-header">Visualize</h6>
			  <div class="dropdown-divider"></div>
			    <a class="dropdown-item" href="`
			    + urlValue +
			    `" target="_blank" value=".bib" type="button">Visit Mendeley Record</a>
			    <div class="dropdown-divider"></div>
       				    <button class="display-button__display-option dropdown-item" value="json" type="button">JSON</button>
				    <button class="display-button__display-option dropdown-item" value="bib" type="button">BibTeX</button>
			  </div>
			  
			</div>
		</span>
	
	<span class="result-item__title-span">
		<a class="result-item__title" href="`
		+ urlValue +
		`" target="_blank">`
		+ nameValue +
		`</a>
		<span class="result-item__info-span">
			<a class="result-item__info--date">`
			+ yearValue +
			`</a>
			<a class="result-item__info--venue">`
			+ sourceValue +
			`</a>
			<a class="result-item__info--type">`
			+ typeValue +
			`</a>
		</span>
	</span>
	
	<span class="result-item__options--right">
	<button type="button" class="result-item__select-button icon-button">
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-box-arrow-in-right" viewBox="0 0 16 16">
		  <path fill-rule="evenodd" d="M6 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 0-1 0v2A1.5 1.5 0 0 0 6.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-8A1.5 1.5 0 0 0 5 3.5v2a.5.5 0 0 0 1 0z"/>
		  <path fill-rule="evenodd" d="M11.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H1.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
		</svg>
	</button>
</span>
	
</li>`);
}
	
function createSelectedItem(result){
	
	let urlValue;
	let nameValue;
	
	//console.log(isXML(result));
	//console.log(result);
	
	if(isXML(result)){
	
		let urlElement;
		let urlElementNames = ['ee', 'url'];
		
		//for each possible url element, until urlElement isnt undefined
		for(let i = 0; urlElement==undefined && i<urlElementNames.length; i++){
			urlElement = result.getElementsByTagName(urlElementNames[i])[0];
		}
		//if urlElement remains undefined, no elements were found. Make urlValue an empty string
		if(urlElement == undefined){urlValue="";}
		//otherwise, make it urlElement's innerHTML
		else{urlValue=urlElement.innerHTML;}
		
		let nameElement = result.getElementsByTagName("title")[0];
		if(nameElement == undefined){nameValue="<<No Name Found for This Article>>";}
		else{nameValue=nameElement.innerHTML;}

	}
	else if(result.citationKey==undefined){
		try{
		nameValue = "[LOADED .BIB ITEM]\n" + result.entryTags.title;
		urlValue = result.entryTags.url;
		}
		catch(error){
			urlValue = result.link;
			if(urlValue == undefined){urlValue="";}

			nameValue = result.title;
			if(nameValue == undefined){nameValue="<<No Title Found for This Article>>";}
		}
	}
	else{
		nameValue = "[LOADED .BIB ITEM]\n" + result.entryTags.title;
		urlValue = result.entryTags.url;
	}
	
	return(`<li class="selected-item">
		<span>
			<button type="button" class="selected-item__remove-button icon-button">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dash-circle" viewBox="0 0 16 16">
				  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
				  <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8"/>
				</svg>
			</button>
		</span>
	
		<span class="result-item__title-span">
			<a class="result-item__title" href="`
			+ urlValue +
			`" target="_blank">`
			+ nameValue +
			`</a>
		</span>
	
		<span class="selected-item__move-span">
			
			<button type="button" class="selected-item__up-button icon-button">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-up-short" viewBox="0 0 16 16">
				  <path fill-rule="evenodd" d="M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5"/>
				</svg>
			</button>
			
			<button type="button" class="selected-item__down-button icon-button">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down-short" viewBox="0 0 16 16">
				  <path fill-rule="evenodd" d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4"/>
				</svg>
			</button>
			
		</span>

	</li>`)
}

function populatePaginationBar(currPage, maxPage){
	let indexArray = generate(currPage, maxPage);
	
	let frag = document.createDocumentFragment();
	
	indexArray.forEach((index) => {
		//console.log(index);
		//<li class="page-item"><button type="button" class="page-link" value="1">1</button></li>
		let listItem = document.createElement("li");
		if(index==currPage){	listItem.setAttribute("class", "page-item selected-page");}
		else{					listItem.setAttribute("class", "page-item");}
		let pagButton = document.createElement("button");
		pagButton.setAttribute("type", "button");
		pagButton.setAttribute("class", "page-link");
		pagButton.setAttribute("value", index);
		pagButton.innerHTML=index;
		listItem.appendChild(pagButton);
		
		frag.appendChild(listItem);
	});
	
	let paginationList = document.getElementById(paginationListId);
	
	paginationList.replaceChildren();
	paginationList.appendChild(frag);
}

function generate(curPage, numPages, numPagesAtEdges = 2, numPagesAroundCurrent = 2, glue = "...") {
    const numItemsInSequence = 1 + (numPagesAroundCurrent * 2) + (numPagesAtEdges * 2) + 2;

    // curPage cannot be greater than numPages.
    const reworkedCurPage = Math.min(curPage, numPages);

    // The value we're about to return$
    let finalSequence = [];

    // If we have less than numItemsInSequence pages in total, there is no need to
    // start calculating but just return the full sequence, starting at 1
    if (numPages <= numItemsInSequence) {
        finalSequence = range(1, numPages);
    }

    // We have more pages than numItemsInSequence, start calculating
    else {

        // If we have no forced amount of items on the edges, then the
        // sequence must start from the current page number instead of 1
        const start = (numPagesAtEdges > 0) ? 1 : reworkedCurPage;

        // Parts of the sequence we'll be generating
        const sequence = {
            leftEdge: null,
            glueLeftCenter: null,
            centerPiece: null,
            glueCenterRight: null,
            rightEdge: null,
        };

        // If the current page is nearby the left edge (viz. curPage is
        // less than half of numItemsInSequence away from left edge):
        // Don't generate a Center Piece, but extend the left part as
        // the left part would otherwise overlap the center piece.
        if (reworkedCurPage < (numItemsInSequence/2)) {
            sequence.leftEdge = range(1, Math.ceil(numItemsInSequence/2) + numPagesAroundCurrent);
            sequence.centerPiece = [glue];
            if (numPagesAtEdges > 0) sequence.rightEdge = range(numPages-(numPagesAtEdges-1), numPages);
        }

        // If the current page is nearby the right edge (viz. curPage is
        // less than half of numItemsInSequence away from right edge):
        // Don't generate a center piece but extend the right part as
        // the right part would otherwise overlap the center piece.
        else if (reworkedCurPage > numPages - (numItemsInSequence/2)) {
            if (numPagesAtEdges > 0) sequence.leftEdge = range(start, numPagesAtEdges);
            sequence.centerPiece = [glue];
            sequence.rightEdge = range(Math.min(numPages - Math.floor(numItemsInSequence/2) - numPagesAroundCurrent, reworkedCurPage - numPagesAroundCurrent), numPages);
        }

        // The current page falls somewhere in the middle:
        // Generate ranges normally
        else {

            // Center Piece
            sequence.centerPiece = range(reworkedCurPage - numPagesAroundCurrent, reworkedCurPage + numPagesAroundCurrent);

            // Left/Right Edges (only if we requested)
            if (numPagesAtEdges > 0) sequence.leftEdge = range(start,numPagesAtEdges);
            if (numPagesAtEdges > 0) sequence.rightEdge = range(numPages-(numPagesAtEdges-1), numPages);

            // The glue we'll use to stick left, center, and right together
            // Special case: If the gap between left and center is only one
            // unit, don't add '...' but add that number instead
            sequence.glueLeftCenter = (sequence.centerPiece[0] == (numPagesAtEdges+2)) ? [numPagesAtEdges+1] : [glue];
            sequence.glueCenterRight = [glue];

        }

        // Join all (non-empty) parts of sequence into the final sequence
        finalSequence = Object.values(sequence).filter(v => v !== null).flat();

    }

    return finalSequence;
}

function range(first, last){
	let res = [];
	for (let i=first; i<=last; i++){
		res.push(i);
	}
	return res;
}

function filterResultsDBLP(){
	JsLoadingOverlay.show();
	let minYearFilter = document.getElementById(minYearFilterId).value;
	let maxYearFilter = document.getElementById(maxYearFilterId).value;
	let pubTypeFilter = document.getElementById(pubTypeFilterId).value;
	
	if(minYearFilter==maxYearFilter && maxYearFilter==pubTypeFilter && pubTypeFilter==""){
		
		usableResults=fetchedResults;
		
	}
	
	else{
		let filteredResults = [];
	
		if(fetchedResults==null){
			createResultErrorMessage("No results were found for the specified filters. Please try again with different filtering options or make your Mendeley search more specific.");
			JsLoadingOverlay.hide();
			return;
		}
		fetchedResults.forEach(element => {
			let validSoFar = true;
			
			if(minYearFilter!="" && validSoFar){
				let elemMinYear = element.year;
				if(!(elemMinYear==undefined)){
				validSoFar = (elemMinYear>=minYearFilter);
				}
				else{validSoFar = false;}
			}
			
			if(maxYearFilter!="" && validSoFar){
				let elemMaxYear = element.year;
				if(!(elemMaxYear==undefined)){
					validSoFar = (elemMaxYear<=maxYearFilter);
				}
				else{validSoFar = false;}
			}
			
			if(pubTypeFilter!="" && validSoFar){
				//console.log(pubTypeFilter);
				let elemType = element.type;
				if(!(elemType==undefined)){
					validSoFar = (elemType.toLowerCase()==pubTypeFilter.toLowerCase());
				}
				else{validSoFar = false;}
			}
			
			if(validSoFar){
				filteredResults.push(element);
			}
			
			
		});
		
		usableResults = filteredResults;
		//console.log(usableResults);
		if(usableResults.length==0){
			createResultErrorMessage("No results were found for the specified filters. Please try again with different filtering options or make your Mendeley search more specific.");
			JsLoadingOverlay.hide();
			return;
		}
		
	}

JsLoadingOverlay.hide();
populateResultsMendeley(1);
}

function saveSelectedResults(){
	let serializer = new XMLSerializer();
	let selectionData = Array.from(document.getElementById("results__selected-list").children).map((item)=>{
		let itemData = getJQData(item, "result");
		if(isXML(itemData)){
			itemData = serializer.serializeToString(itemData);
		}
		return itemData;
	});
	sessionStorage.setItem("BiblioSearch-User_Selection-Mendeley", JSON.stringify(selectionData));
}

function populateSelectedResults(){
	let parser = new DOMParser();
	//retrieve the locally stored user selection data
	//for every item in it
		//make a new <li> entry in the selected results list
		//give the <li> element all associated data through jquery
	let selectionData = JSON.parse(sessionStorage.getItem("BiblioSearch-User_Selection-Mendeley"));
	if(Array.isArray(selectionData)){
		if(selectionData.length>0){
			document.getElementById("results-elements").style.display="block";
		}
		selectionData.forEach((item) => {
			if(typeof item === 'string'){
				item = parser.parseFromString(item, "text/xml");
			}
			else if(!(item.citationKey==null)){disableReferenceFormats(true, "bib")}
			selectResult(item);
		})
	}
}

attachJQData = function(element, key, dat)
{
	$(element).data(key, dat);
};

getJQData = function(element, key)
{
	return ($(element).data(key));
};

function selectResult(refData){
	JsLoadingOverlay.show();
	//try{
		//let refData = getJQData(result, "result");
		//let ref = convertXMLToReference(refData);
		//console.log(refData);
		let selectedListItem = createSelectedItem(refData);
		//console.log(selectedListItem);
		let liElement = $.parseHTML(selectedListItem);
		//console.log(liElement);
		attachJQData(liElement[0], "result", refData)
		//console.log("test");
		document.getElementById("results__selected-list").appendChild(liElement[0]);
		saveSelectedResults();
		JsLoadingOverlay.hide();
		liElement[0].scrollIntoView();
	/*}
	catch{
		alert("An error ocurred while selecting the result.");
		JsLoadingOverlay.hide();
	}*/
	
	//get a reference to the father <li> of the current checkbox
	//make a new <li> entry in the selected results list
	//link the new <li> to the associated <li> data in the results list
}

async function generateCustomXML(element, results){
	let parser = new DOMParser();
	
	let uncheckedAttrChecks = Array.from(element.querySelectorAll('.custom-format__attribute-checkbox:not(:checked)'));
	let discarded = ["month", "number", "booktitle", "crossref", "isbn", "publisher"];
	let xmlData = await obtainSelectedResultsDBLP(results, "xml");
	
	xmlObject = parser.parseFromString(xmlData, "text/xml");
	
	uncheckedAttrChecks.forEach((item) => {
		Array.from(xmlObject.getElementsByTagName(item.getAttribute("value"))).forEach((tagElem) => {
			//console.log(tagElem);
			tagElem.remove();
		});
		
	});
	
	discarded.forEach((item) => {
		//console.log(item);
		Array.from(xmlObject.getElementsByTagName(item)).forEach((tagElem) => {
			//console.log(tagElem);
			tagElem.remove();
		});
		
	});
	let xmlSer = new XMLSerializer();
	return xmlSer.serializeToString(xmlObject);
	
	
}

async function obtainSelectedResultsDBLP(results, format){
	//try{
		let dataToDownload = "";
		console.log(results);
		switch(format){
			case "json":
				dataToDownload = [];
				for (let result of results){
					//results.forEach(async function(result){
					let refData = getJQData(result, "result");
					//console.log(refData);
					if(!(refData.citationKey==undefined)){
						//console.log(bibtexParse.toBibtex([refData]));
						let bibDat = bibtexParse.toBibtex([refData], false)
						dataToDownload.push(bibDat);
					}
					else{
						let jsonDat = JSON.stringify(refData);
						dataToDownload.push(jsonDat);
					}
				}
				/*if(results.length==1){
					dataToDownload = dataToDownload.references[0];
				}*/
				dataToDownload = JSON.parse(JSON.stringify(dataToDownload));
				break;
			case "bib":
				for (let result of results){
					let refData = getJQData(result, "result");
					if (!(refData.citationKey==undefined)){
						
						let dat = bibtexParse.toBibtex([refData], false)
						dataToDownload+=dat;
					}
					else{
						let bibDat = convertMendeleyJSONtoBibTeX(refData);
						let dat = bibtexParse.toBibtex([bibDat], false)
						dataToDownload+=dat;
					}
					
				}
				break;
		}
		
		if(results.length > 1 && (format === "xml" || format == "rdf")){
			dataToDownload = dataToDownload.split('\n').filter(function(line){ 
			    return line.indexOf( "<?xml version=" ) == -1;
			  }).join('\n')
			if(format === "xml"){
				dataToDownload = "<dblp>" + dataToDownload.replaceAll("<dblp>", "").replaceAll("</dblp>", "") + "</dblp>";
			}
			dataToDownload = `<?xml version="1.0"?>` + dataToDownload;
	}
	return dataToDownload;
	/*}
	catch(error){
	}
	finally{
	}*/
}

async function displayResults(dataToDisplay, format){
	JsLoadingOverlay.show();
	//try{
	dataToDisplay = await dataToDisplay;
	let type;
	if (format == "json"){
		type = 'application/'+format;
	}
	else{
		type = 'text/'+format;
	}
	let blob = new Blob([dataToDisplay], {type: (type)});
	
	  let url = URL.createObjectURL(blob);
	  //console.log(dataToDisplay);

	  window.open(url);
	  URL.revokeObjectURL(url);
	/*}
	catch(error){
	}
	finally{*/
		JsLoadingOverlay.hide();
	//}
}

async function downloadResults(dataToDownload, format){
	JsLoadingOverlay.show();
	try{
		dataToDownload = await dataToDownload;
		let file = new File([dataToDownload], Date.now()+"."+format, {
		})
	
	  let link = document.createElement('a');
	  let url = URL.createObjectURL(file);

	  link.href = url;
	  link.download = file.name;
	  
	  document.body.appendChild(link);
	  link.click();

	  document.body.removeChild(link);
	  window.URL.revokeObjectURL(url);
	}
	catch(error){
	}
	finally{
		JsLoadingOverlay.hide();
	}
	
	//switch desired format
		//case the desired format is json, do nothing
		//case xml, convert results
		//case bib, convert results
	//if the user wishes to display the content on his browser
		//open a new window with the data
	//else download the result
}

/*function processSelectedResults(){
	//for every <li> in the selected results list
		//determine if it is linked to the data of a results list <li>
			//if it is, make such <li> the target of the next action
		//appent the <li>'s associated jquery data to a variable/datatype in json format, skipping all unselected formats if any (custom format)
	//call the download results function
}*/

function loadBibContents(contents){
	let added = false;
	try{
	let refs = bibtexParse.toJSON(contents);
	//console.log(refs);
	refs.forEach((item) => {
		selectResult(item);
		added = true;
	});
	}
	catch(error){
	}
	finally{
		if(added){disableReferenceFormats(true, "bib");}
	}
}

function disableReferenceFormats(disable, format){
	let list = document.querySelectorAll(".selected-list__download-option, .selected-list__display-option, #selected-list__visualize-custom-xml, #selected-list__download-custom-xml");
	list.forEach((button) => {
		if(disable && button.getAttribute("value")!=format){button.setAttribute("disabled", "");}
		else{button.removeAttribute("disabled");}
	})
}

function checkForLoadedFormats(){
	let list = Array.from(document.getElementById("results__selected-list").children);
	//check all selected references for one in a non-xml format
	let found = list.some(function(item) {
		let itemData = (getJQData(item, "result"));
		return (typeof itemData === 'string' || itemData instanceof String);
	});
	//if all references are xml, we can reenable the other formats
	if(!found){
		disableReferenceFormats(false);
	}
}

$(document).ready(function(){
	
	initialize();
	
  /*$('#'+searchMethodSelectId).on('change', function(){
	  updateAdvancedOptions();
	  });*/
  
  $("#"+searchButtonId).on("click", function(){
	  //obtainResultsDBLP();
	  //DBLPSearch(generateNewRequest());
	});
  
	$('#search-form').submit(function(){
		JsLoadingOverlay.show();
	});

	$("#results__result-list").on("click", ".result-item__pub-title", function(e) {
		e.preventDefault();
		let id = this.parentElement.getElementsByClassName("result-item__id")[0].innerHTML.replace('ID: ','');
		if(id != "" && !publicationSearchMethods.includes(currentSearchMethod) && (/..*[/].*./).test(id.replace(/\s/g,''))){
			document.getElementById(searchBarTextInputId).value = id;
			let method = "";
			console.log(currentSearchMethod);
			if(currentSearchMethod == "search/author/api"){method = "pid/"}
			else if(currentSearchMethod == "search/venue/api"){method = "db/"}
			let methodSelect = document.getElementById(searchMethodSelectId);
			selectOptionByValue(methodSelect, method);
			document.getElementById('search-form').submit();
		}
	});
	  
  $(document).mouseup(function(e) 
		  {
		      let container = $("#advanced-search__elements");

		      // if the click target isn't the container nor a descendant of the container
		      if (!container.is(e.target) && container.has(e.target).length === 0) 
		      {
		    	  $('#touch').prop('checked', false);
		      }
		  });
  
  $("#touch").change(function() {
	  $("#advanced-search__dropdown-arrow").toggleClass('flipped');
	});
  
  $('#min-year').on("blur", function(e){
	  this.value < this.min ? this.value=this.min : (this.value > this.max ? this.value=this.max : '');
  });
	  
  $("#result-filters__filter-button").on("click", function(){
	  filterResultsDBLP();
	  //DBLPSearch(generateNewRequest());
	});
  
  $("#pagination-list").on("click", ".page-link", function(){
		 populateResultsMendeley(this.value);
	});
  
  $("#results__result-list").on("click", ".result-item__select-button", function(){
	  selectResult(getJQData(this.parentElement.parentElement, "result"));
	  //DBLPSearch(generateNewRequest());
	});

  $("#results__result-list").on("click", ".download-button__download-option", function(){
	  downloadResults(obtainSelectedResultsDBLP([this.parentElement.parentElement.parentElement.parentElement], this.value), this.value);
	});
  
  $("#results__result-list").on("click", ".display-button__display-option", function(){
	  displayResults(obtainSelectedResultsDBLP([this.parentElement.parentElement.parentElement.parentElement], this.value), this.value);
  });
  
  $(".selected-list__download-option").on("click", function(){
	  downloadResults(obtainSelectedResultsDBLP(Array.from(document.getElementById("results__selected-list").children), this.value), this.value);
	});
  
  $(".selected-list__display-option").on("click", function(){
	  displayResults(obtainSelectedResultsDBLP(Array.from(document.getElementById("results__selected-list").children), this.value), this.value);
	});
  
  $("#selected-list__download-custom-xml").on("click", function(){
	  downloadResults(generateCustomXML(this.parentElement.parentElement, Array.from(document.getElementById("results__selected-list").children)), this.value);
	});
  
  $("#selected-list__visualize-custom-xml").on("click", function(){
	  displayResults(generateCustomXML(this.parentElement.parentElement, Array.from(document.getElementById("results__selected-list").children)), this.value);
	});
  
  $("#results__selected-list").on("click", ".selected-item__remove-button", function(){
	  let ref = getJQData(this.parentElement.parentElement, "result");
	  this.parentElement.parentElement.remove();
	  if (!isXML(ref)){
		//console.log(ref);
		checkForLoadedFormats();
	  }
	  saveSelectedResults();
	});

$("#results__selected-list").on("click", ".selected-item__up-button", function(){
	$(this).parent().parent().moveUp();
	saveSelectedResults();
	});

$("#results__selected-list").on("click", ".selected-item__down-button", function(){
	$(this).parent().parent().moveDown();
	saveSelectedResults();
	});
  
  $.fn.moveUp = function() {
	    before = $(this).prev();
	    $(this).insertBefore(before);
	};

  $.fn.moveDown = function() {
	    after = $(this).next();
	    $(this).insertAfter(after);
	};
	
	$('.dropdown-submenu a.selected-list__custom-option').on("click", function(e){
	    $(this).next('ul').toggle();
	    e.stopPropagation();
	    e.preventDefault();
	  });
	
	$("#file-upload-input").on("change", function(){
		var file = this.files[0];
		if (file) {
		    var reader = new FileReader();
		    reader.readAsText(file, "UTF-8");
		    reader.onload = function (evt) {
		        loadBibContents(evt.target.result);
		        alert(".bib references loaded\nNon-BibTex formats disabled");
		    }
		    reader.onerror = function (evt) {
		        alert("Error reading file.");
		    }
		}
	});
})
