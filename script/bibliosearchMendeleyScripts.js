//const { MendeleySDK } = require("./mendeley-sdk/standalone.min");

const endpointDBLP = "https://dblp.org/";
const recPrefixDBLP = "rec/";
const defaultAPIFormatDBLP = "xml";
const defaultFormatDBLP = "xml";
//const apiDefaultMaxHitsDBLP = 30;
//const apiMaxHitsLargeDBLP = 500;

const searchFormId = "search-form";
const searchButtonId = "search-bar__search-button";
const advancedSearchOptionListId = "advanced-search__list";
const searchBarTextInputId = "search-bar__text-input"
const searchMethodSelectId = "search-bar__method-select";
const resultsNumberSelectId = "results-number-input";

const authorInputId = "author-input";
const venueInputId = "venue-input";
const minYearInputId = "min-year";
const maxYearInputId = "max-year";
const pubTypeInputId = "type-input";

const titleFilterId = "title-filter";
const authorFilterId = "author-filter";
const venueFilterId = "venue-filter";
const minYearFilterId = "min-year-filter";
const maxYearFilterId = "max-year-filter";
const pubTypeFilterId = "type-filter";
const resultsPerPageId = "results-per-page";

const paginationListId = "pagination-list";

const toggleableSearchOptions = [["adv-author", "adv-venue"], ["adv-author", "adv-venue"], ["adv-author", "adv-venue"], ["adv-venue"], ["adv-author"]];

const publicationSearchMethods = ["search/publ/api", "pid/", "db/"];

const idSearchMethods = ["pid/", "db/"];

const mendeleyParams = ["title", "author", "source", "abstract", "min_year", "max_year", "max_year", "open_access"];

const dictTypesDBLPtoBIB = {
		BooksandTheses:"",
		JournalArticles:"",
		ConferenceandWorkshopPapers:"",
		PartsinBooksorCollections:"",
		Editorship:"",
		ReferenceWorks:"",
		DataandArtifacts:"",
		InformalandOtherPublications:""
}

//var resultsPerSearch = 1500;
//var resultsPerPage = 50;

var previousMethodIndex;
var previousSearchURL;
var currentSearchMethod;
var fetchedResults;
var usableResults;

//var mendeleySDK = require('@mendeley/api');
let mendeleyAPI;

function initialize(){
	/*previousMethodIndex = document.getElementById(searchMethodSelectId).selectedOptions[0].index;
	document.getElementById(maxYearInputId).setAttribute("max", new Date().getFullYear());
	document.getElementById(minYearInputId).setAttribute("max", new Date().getFullYear());*/

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
	
	/*let searchParams = [];
	
	mendeleyParams.forEach((param) => {
		let paramValue = searchParams.get(param);
		if(paramValue != "" && paramValue != undefined){
			searchParams.push(paramValue);
		}
	});*/

	searchQuery = searchParams.get("query");
	searchTitle = searchParams.get("title");
	searchAuthor = searchParams.get("author");
	searchSource = searchParams.get("source");
	searchAbstract = searchParams.get("abstract");
	searchMinYear = searchParams.get("min_year");
	searchMaxYear = searchParams.get("max_year");
	//searchOpenAccess = searchParams.get("open_access");
	
	let mendeleyUriArgs = {
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
	
	//sessionStorage.setItem("BiblioSearch-User_Selection-DBLP", JSON.stringify(selectionData));
	
	else{
		populateSelectedResults();
		
		document.getElementById(searchBarTextInputId).value=searchTerm;
		let methodSelect = document.getElementById(searchMethodSelectId);
		selectOptionByValue(methodSelect, searchMethod);
		//let numberSelect = document.getElementById(resultsNumberSelectId);
		//selectOptionByValue(numberSelect, desiredResults);
		
		obtainResultsMendeley(mendeleyUriArgs);
	}
	
	//populatePaginationBar(1,1);
	
	
	
	/*let bib = `@phdthesis{DBLP:phd/tr/Namli11,
		  author       = {Tuncay Namli and Anon Postus},
		  title        = {TestBATN-a scenario based test platform for conformance and interoperability
		                  testing (TestBATN-senaryo tabanl{\i} uygunluk ve birlikte i{\c{s}}lerlik
		                  test platformu)},
		  school       = {Middle East Technical University, Turkey},
		  year         = {2011},
		  url          = {https://tez.yok.gov.tr/UlusalTezMerkezi/tezDetay.jsp?id=eKo3LK\_LVdT64qw6R2VvKA\&no=2245Ha8d4QDPPjobE2GTeg},
		  timestamp    = {Sun, 03 Dec 2023 12:24:25 +0100},
		  biburl       = {https://dblp.org/rec/phd/tr/Namli11.bib},
		  bibsource    = {dblp computer science bibliography, https://dblp.org}
		}`/*
		/*
	let cit = new Cite(bib);
	let ref = cit.format('data', {format: 'object'});
	(ref);
	let citcit = new Cite(ref);
	let refref = cit.format('data', {format: 'bibtex'});
	(refref);
	alert(refref);*/
	/*let cit = bibtexParse.toJSON(bib);
	(cit);*/
	

};

async function convertXMLToReference(obj){
	if(!isDOMElement(obj)){
		//throw error
		}
		let keyList = Array.from(obj.getElementsByTagName("key"));
		if(keyList.length>0){
			let obtained = await searchDBLP(generateNewRequest(recPrefixDBLP, keyList[0].innerHTML, "bib")).then((e) => {return e;});
			//(obtained);
			/*let refCite = new Cite(obtained);
			let ref = refCite.format('data', {format: 'object'});
			return ref;*/
		}
		


		let authorList = Array.from(obj.getElementsByTagName("author"));
		if(authorList.length>0){
			
		}

		
		let venueList = Array.from(obj.getElementsByTagName("venue"));
		if(venueList.length>0){
			
		}
		
		let yearList = Array.from(obj.getElementsByTagName("year"));
		if(yearList.length>0){
			
		}
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

/*function updateAdvancedOptions(){
//get the index value from the selected method
	let selectedMethodIndex = document.getElementById(searchMethodSelectId).selectedOptions[0].index;
//get the search option list's id
	let advancedOptionsList = document.getElementById(advancedSearchOptionListId);
//get a list/array with all entries inside the search option list
	let advancedOptions = document.getElementById(advancedSearchOptionListId).getElementsByTagName("li");
//if there was a previous selected method, for every element y from the list of options that the old method toggled on, disable their display
	if(previousMethodIndex!=null){
		for(let i=0; i<toggleableSearchOptions[previousMethodIndex].length; i++){
			document.getElementById(toggleableSearchOptions[previousMethodIndex][i]).style.display="none";
		}
	}
//for every element y from the list of options that the current method can toggle, enable their display
	for(let i=0; i<toggleableSearchOptions[selectedMethodIndex].length; i++){
		document.getElementById(toggleableSearchOptions[selectedMethodIndex][i]).style.display="block";
	}
}*/

function selectOptionByValue(selectElement, value){
	for (let i = 0; i<selectElement.options.length; i++){
		if(selectElement.options[i].getAttribute("value")==value){
			selectElement.options.selectedIndex = i;
		}
	}
}

function generateNewAPIRequest(searchMethod, searchTerm, desiredResults, index){
	return endpointDBLP + searchMethod + "?q=" + encodeURIComponent(searchTerm) +"&h=" + Math.min(1000, desiredResults)/*resultsPerSearch getMaxInputs()*/ + "&f=" + index + "&format=" + defaultAPIFormatDBLP;
}

function generateNewRequest(prefix, term, suffix, format){
	return endpointDBLP + prefix + term + suffix + "." + format;
}

/*function getMaxInputs(){
	let allInputsEmpty = true;
	
	(document.getElementById(advancedSearchOptionListId).querySelectorAll('input').forEach((element) => {
	        if (element.value != '') {
	        	allInputsEmpty = false;
	            return false;
	        }
	    }));
	if(allInputsEmpty){
		return apiDefaultMaxHitsDBLP;
	}
	return apiMaxHitsLargeDBLP;
}
*/
	
const searchDBLP = (requestURL) => {
	//if requestURL differs from the previous one, reset index parameters
	//alert(requestURL);
	return fetch(requestURL)
	  .then(response => {
	    if (!response.ok) {
	    	(response.status);
	    	if (response.status === 404) throw new Error('The requested resource could not be found: \n' + requestURL);
	    	else if (response.status === 500) throw new Error('An Internal server error ocurred during your search.');
	    	else if (response.status === 429) throw new Error('Too many requests. Try again later.')
	    	else throw new Error(response.status + ": " + 'Network response was not ok');
	    }
	    else if(response.ok){
	    	if (response.status === 404) throw new Error('The requested resource could not be found: \n' + requestURL);
	    	else if (response.status === 500) throw new Error('An Internal server error ocurred during your search.');
	    	else if (response.status === 429) throw new Error('Too many requests. Try again later.')
	    }
	    return response.text();
	  })
	  .then(data => {
	    // Display data in an HTML element
	    //outputElement.textContent = JSON.stringify(data, null, 2);
	    //console.log(data);
	    return data;
	  })
	  .catch(error => {
		  //fail first, errors should always be thrown as soon as they happen
		  //console.log(isNetworkError(error));
		  //alert('Error: ' + error.message);
		  if (isNetworkError(error)){alert('Error: Failed to establish connection to the server.\nThis may be due to network problems or other issues, or you may have made too many requests.\nIf the issue persists, try checking your internet connection, lowering your desired number of results under the Advanced Search menu, and trying again later.')}
		  //else {alert('Error: ' + error.message);}
	  });
	//if reset is false, the user is currently scrolling down the results list, and thus the page should not be reloaded
		//else, save all necessary data such as the user's selected results in local storage for later retrieval via the save selected results function
		//make the petition, reloading the page and letting the results function take care of the rest
}

async function obtainResultsMendeley(uriArgs){
	//retreive results obtained from api petition
	//let page = window.open();
    //page.document.write(data);
    
    JsLoadingOverlay.show();
    //try{
		let data="";
		let parser = new DOMParser();
		
		//process the retreived results to obtain the list of article items
		fetchedResults = [];
		//let searchMethod = document.getElementById(searchMethodSelectId).selectedOptions[0].value;

	console.log(uriArgs);

		let usableArgs = Object.fromEntries(Object.entries(uriArgs).filter(([_, v]) => v != null && v != ""));
	console.log(usableArgs);
		let req = mendeleyAPI.search
		    .catalog(uriArgs);

	console.log(req);
	req.then(function (data){
		console.log(data);
	});
		    //.done(receiveResultsMendeley)
		    //.fail(errorHandler);
		
		currentSearchMethod = searchMethod;
		usableResults = fetchedResults;
		JsLoadingOverlay.hide();
		populateResultsDBLP(1);
/*	}
    catch(error){
    	//console.log(error);
    	currentSearchMethod = document.getElementById(searchMethodSelectId).selectedOptions[0].value;
    	usableResults=[];
    	createResultErrorMessage("No results were found for the current search terms.")
    	JsLoadingOverlay.hide();
    }*/
}

function receiveResultsMendeley(data){
	console.log(data);
}

function populateResultsDBLP(pageNumber){
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
		let resultCreator;
		if(publicationSearchMethods.includes(currentSearchMethod)){
			resultCreator = (x) => {return createResultItem(x)};
		}
		else{resultCreator = (x) => {return createGenericResultItem(x)};}
			
		for(let i = index; i < maxIndex; i++){
			//console.log(resultCreator);
			//console.log(filteredResults[i]);
			//using document fragments because adding elements to them and then adding the fragment to the father element as a child is faster than adding all of them into the live page one by one
			//we dont use innnerHTML because its slow and may cause security issues
			//console.log(filteredResults[i]);
			frag.innerHTML+=resultCreator(filteredResults[i]);
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
	let urlElement;
	let urlValue;
	let urlElementNames = ['ee', 'url'];
	/*let venElement;
	let venValue;
	let venElementNames = ['venue', 'school'];*/
	//for each possible url element, until urlElement isnt undefined
	for(let i = 0; urlElement==undefined && i<urlElementNames.length; i++){
		urlElement = result.getElementsByTagName(urlElementNames[i])[0];
	}
	//if urlElement remains undefined, no elements were found. Make urlValue an empty string
	if(urlElement == undefined){urlValue="";}
	//otherwise, make it urlElement's innerHTML
	else{urlValue=urlElement.innerHTML;}
	
	/*for(let i = 0; venElement==undefined && i<venElementNames.length; i++){
		console.log(result);
		console.log(venElement);
		console.log(venElementNames[i]);
		console.log(result.getElementsByTagName(venElementNames[i])[0]);
		venElement = result.getElementsByTagName(venElementNames[i])[0];
	}
	if(venElement == undefined){venValue="Unknown";}
	else{venValue=venElement.innerHTML;}*/
	
	let DBLPUrlElement = result.getElementsByTagName("url")[0];
	let DBLPUrlValue;
	if(DBLPUrlElement == undefined){DBLPUrlValue="<<No Name Found for This Article>>";}
	else{DBLPUrlValue = DBLPUrlElement.innerHTML;}
	if(!DBLPUrlValue.includes(endpointDBLP)){
		DBLPUrlValue = endpointDBLP + DBLPUrlValue;
	}
	//console.log(DBLPUrlValue);
	
	let yearElement = result.getElementsByTagName("year")[0];
	let yearValue;
	if(yearElement == undefined){yearValue="Unknown Year";}
	else{yearValue = yearElement.innerHTML;}
	
	let venueElement = result.getElementsByTagName("venue")[0];
	let venueValue;
	if(venueElement == undefined){venueValue="";}
	else{venueValue = "- " + venueElement.innerHTML;}
	
	let typeElement = result.getElementsByTagName("type")[0];
	let typeValue;
	if(typeElement == undefined){typeValue="";}
	else{typeValue = "- " + typeElement.innerHTML;}
	
	let nameElement = result.getElementsByTagName("title")[0];
	if(nameElement == undefined){nameValue="<<No Name Found for This Article>>";}
	else{nameValue=nameElement.innerHTML;}
	
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
			    <button class="download-button__download-option dropdown-item" value="bib" type="button">BibTeX</button>
			    <button class="download-button__download-option dropdown-item" value="ris" type="button">RIS</button>
			    <button class="download-button__download-option dropdown-item" value="nt" type="button">RDF N-Triples</button>
			    <button class="download-button__download-option dropdown-item" value="ttl" type="button">RDF Turtle</button>
			    <button class="download-button__download-option dropdown-item" value="rdf" type="button">RDF/XML</button>
			    <button class="download-button__download-option dropdown-item" value="xml" type="button">XML</button>
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
			    + DBLPUrlValue+
			    `" target="_blank" value=".bib" type="button">Visit DBLP Record</a>
			    <div class="dropdown-divider"></div>
				    <button class="display-button__display-option dropdown-item" value="bib" type="button">BibTeX</button>
				    <button class="display-button__display-option dropdown-item" value="ris" type="button">RIS</button>
				    <button class="display-button__display-option dropdown-item" value="nt" type="button">RDF N-Triples</button>
				    <button class="display-button__display-option dropdown-item" value="ttl" type="button">RDF Turtle</button>
				    <button class="display-button__display-option dropdown-item" value="rdf" type="button">RDF/XML</button>
				    <button class="display-button__display-option dropdown-item" value="xml" type="button">XML</button>
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
			+ venueValue +
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

function createGenericResultItem(result){
	let nameElement;
	let nameValue;
	let nameElementNames = ['author', 'venue'];
	//for each possible name element, until nameElement isnt undefined
	for(let i = 0; nameElement==undefined && i<nameElementNames.length; i++){
		nameElement = result.getElementsByTagName(nameElementNames[i])[0];
	}
	//if urlElement remains undefined, no elements were found. Make urlValue an empty string
	if(nameElement == undefined){nameValue="";}
	//otherwise, make it urlElement's innerHTML
	else{nameValue=nameElement.innerHTML;}
	
	let urlElement = result.getElementsByTagName("url")[0];
	let urlValue;
	let idValue;
	if(urlElement == undefined){
		urlValue="<<No Name Found for This Result>>";
		idValue="<<ID not found>>";
	}
	else{
		urlValue=urlElement.innerHTML;

		urlSpanContents = 
		`<div class="btn-group dropleft">
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
		    `" target="_blank" value=".bib" type="button">Visit DBLP Record</a>
		    <div class="dropdown-divider"></div>
		  </div>
		  
		</div>`
		
		let urlSplit = urlValue.split('/');
		idValue = urlSplit[4];
		for(let i = 5; i<urlSplit.length; i++){
			if(urlSplit[i]!=""){
				idValue+="/";
				idValue+=urlSplit[i];
			}
		}
	}
	
	return(`<li class="result-item">
	<span class="result-item__options">`
	+ urlSpanContents +
	`</span>
	
	<span class="result-item__title-span">
		<a class="result-item__title result-item__pub-title" href="`
		+
		`">`
		+ nameValue +
		`</a>
		<span>
		<a class="result-item__id">ID: `
		+ idValue +
		`</a>
		</span>
	</span>
	
	<span class="result-item__options--right">
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
	let titleFilter = document.getElementById(titleFilterId).value;
	let authorFilter = document.getElementById(authorFilterId).value;
	let venueFilter = document.getElementById(venueFilterId).value;
	let minYearFilter = document.getElementById(minYearFilterId).value;
	let maxYearFilter = document.getElementById(maxYearFilterId).value;
	let pubTypeFilter = document.getElementById(pubTypeFilterId).value;
	
	if(titleFilter == authorFilter && authorFilter==venueFilter && venueFilter==minYearFilter && minYearFilter==maxYearFilter && maxYearFilter==pubTypeFilter && pubTypeFilter==""){
		
		usableResults=fetchedResults;
		
	}
	
	else{
		let filteredResults = [];
	
		if(fetchedResults==null){
			createResultErrorMessage("No results were found for the specified filters. Please try again with different filtering options or make your DBLP search more specific.");
			JsLoadingOverlay.hide();
			return;
		}
		fetchedResults.forEach(element => {
			let validSoFar = true;
			
			if(titleFilter!=""){
				let titleList = Array.from(element.getElementsByTagName("title"));
				if(titleList.length>0){
					
					validSoFar = titleList.some(titl => titl.innerHTML.toLowerCase().includes(titleFilter.toLowerCase()));
				}
				else{validSoFar = false;}
			}
			
			if(authorFilter!=""){
				let authorList = Array.from(element.getElementsByTagName("author"));
				if(authorList.length>0){
					
					validSoFar = authorList.some(person => person.innerHTML.toLowerCase().includes(authorFilter.toLowerCase()));
				}
				else{validSoFar = false;}
			}
			
			if(venueFilter!="" && validSoFar){
				let venueList = Array.from(element.getElementsByTagName("venue"));
				if(venueList.length>0){
					validSoFar = venueList.some(ven => ven.innerHTML.toLowerCase().includes(venueFilter.toLowerCase()));
				}
				else{validSoFar = false;}
			}
			
			if(minYearFilter!="" && validSoFar){
				let yearList = Array.from(element.getElementsByTagName("year"));
				if(yearList.length>0){
				validSoFar = yearList.some(yea => yea.innerHTML>=minYearFilter);
				}
				else{validSoFar = false;}
			}
			
			if(maxYearFilter!="" && validSoFar){
				let yearList = Array.from(element.getElementsByTagName("year"));
				if(yearList.length>0){
					validSoFar = yearList.some(yea => yea.innerHTML<=maxYearFilter);
				}
				else{validSoFar = false;}
			}
			
			if(pubTypeFilter!="" && validSoFar){
				//console.log(pubTypeFilter);
				let typeList = Array.from(element.getElementsByTagName("type"));
				if(typeList.length>0){
					validSoFar = typeList.some(typ => typ.innerHTML.toLowerCase()==pubTypeFilter.toLowerCase());
				}
				else{validSoFar = 0;}
			}
			
			if(validSoFar){
				filteredResults.push(element);
			}
			
			
		});
		
		usableResults = filteredResults;
		//console.log(usableResults);
		if(usableResults.length==0){
			createResultErrorMessage("No results were found for the specified filters. Please try again with different filtering options or make your DBLP search more specific.");
			JsLoadingOverlay.hide();
			return;
		}
		
	}

JsLoadingOverlay.hide();
populateResultsDBLP(1);
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
	sessionStorage.setItem("BiblioSearch-User_Selection-DBLP", JSON.stringify(selectionData));
}

function populateSelectedResults(){
	let parser = new DOMParser();
	//retrieve the locally stored user selection data
	//for every item in it
		//make a new <li> entry in the selected results list
		//give the <li> element all associated data through jquery
	let selectionData = JSON.parse(sessionStorage.getItem("BiblioSearch-User_Selection-DBLP"));
	if(Array.isArray(selectionData)){
		if(selectionData.length>0){
			document.getElementById("results-elements").style.display="block";
		}
		selectionData.forEach((item) => {
			if(typeof item === 'string'){
				item = parser.parseFromString(item, "text/xml");
			}
			else{disableReferenceFormats(true, "bib")}
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
	try{
	let dataToDownload = "";
	//console.log(results);
	for (let result of results){
	//results.forEach(async function(result){
		let refData = getJQData(result, "result");
		//console.log(refData);
		if(isXML(refData)){
			let key;
			let keyList = Array.from(refData.getElementsByTagName("key"));
			//console.log(keyList.length);
			if(!(keyList.length>0)){
				keyList = Array.from(refData.querySelectorAll('[key]'));
				//console.log(keyList.length);
				if(keyList.length>0){
					key = keyList[0].getAttribute("key");
				}
				else{
					key=refData.getAttribute("key");
				}
				
			}
			else{
				key = keyList[0].innerHTML;
			}
			//console.log
			if(key!="" || key!=undefined){
				//console.log(generateNewRequest(recPrefixDBLP, key, "", format));
				let obtained = await searchDBLP(generateNewRequest(recPrefixDBLP, key, "", format)).then((e) => {return e;});
				//console.log(obtained);
				if(obtained==undefined){
					//error
					obtained=="";
				}
				/*console.log(obtained.substring(0,14));
				if (format === "xml" && obtained.substring(0,14) === '<?xml version='){
				    // break the textblock into an array of lines
				    let lines = obtained.split('\n');
				    // remove one line, starting at the first position
				    lines.splice(0,1);
				    // join the array back into a single string
				    obtained = lines.join('\n');
				}*/
				dataToDownload+=obtained;
				//console.log(dataToDownload);
			}
		}
		else{
			//console.log(bibtexParse.toBibtex([refData]));
			dataToDownload+=bibtexParse.toBibtex([refData], false);
		}
	}//);
	//if the reference data isnt an XML object, the reference was added through a .bib file
		
	
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
	}
	catch(error){
	}
	finally{
	}
}

async function displayResults(dataToDisplay, format){
	JsLoadingOverlay.show();
	try{
	dataToDisplay = await dataToDisplay;
	let blob = new Blob([dataToDisplay], {type: ('text/'+format)});
	
	  let url = URL.createObjectURL(blob);
	  //console.log(dataToDisplay);

	  window.open(url);
	  URL.revokeObjectURL(url);
	}
	catch(error){
	}
	finally{
		JsLoadingOverlay.hide();
	}
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
		  return (!isXML(getJQData(item, "result")));
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
		let term = document.getElementById(searchBarTextInputId).value
		let method = document.getElementById(searchMethodSelectId).selectedOptions[0].value;
		if(term != "" && idSearchMethods.includes(method) && !(/..*[/].*./).test(term.replace(/\s/g,''))){
			alert("The search term does not resemble a publisher ID. Please, double check the ID you're looking for or use a different search method.");
			JsLoadingOverlay.hide();
			return false;
		}
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
		 populateResultsDBLP(this.value);
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
