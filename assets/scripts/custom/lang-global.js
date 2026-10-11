var isRoot = (location.pathname.match(/\/(\w{1})\/(?:index.html)?$/)) ? false : true;

if (localStorage['lang'] == null) {
	var lang = window.navigator.userLanguage || window.navigator.language;
	lang = lang.substring(0,2);
	// Default a español si el navegador no pide un idioma soportado
	localStorage['lang'] = ([ 'en', 'de', 'ru', 'pl', 'fr' ].indexOf(lang) > -1) ? lang : 'es';
}

//i18n options
window.i18noptions = {
	debug: false,
	getAsync: true,
	ns: 'general',
	lng: localStorage['lang'],
	fallbackLng: 'en',
	resGetPath: ((isRoot) ? "" : "../")+'files/locales/__lng__/__ns__.json',
	useDataAttrOptions: true,
	lngWhitelist: [ 'es', 'en', 'de', 'ru', 'pl', 'fr' ],
	preload: [ 'en' ],
	postProcess: 'dualNames'
};

// En español, los nombres (lugares, monstruos, categorías...) se muestran en los dos idiomas:
// "Ahogados (Drowners)" o "Drowners (Ahogados)" según localStorage['namesFirst'].
var nameSegments = [ 'label', 'label*', 'popupTitle', 'inns', 'witcherGear' ];
var nameRoots = [ 'monsters', 'sidebar', 'maps' ];
var isNameKey = function(key) {
	var parts = key.replace(/^\w+:/, '').split('.');
	if (parts[0] == 'notes') return false;
	if (nameRoots.indexOf(parts[0]) > -1) return true;
	for (var i = 0; i < parts.length; i++) {
		if (nameSegments.indexOf(parts[i]) > -1) return true;
	}
	return false;
};
var inDualNames = false;
$.i18n.addPostProcessor('dualNames', function(value, key, options) {
	if (inDualNames || localStorage['lang'] != 'es' || options.lng || typeof value != 'string' || !isNameKey(key)) return value;
	// i18next le quita el namespace a la llave ("v:monsters.x" -> "monsters.x"); buscamos en cuál está este valor
	var pageNs = location.pathname.match(/\/(\w{1})\/(?:index.html)?$/);
	var namespaces = pageNs ? [ pageNs[1], 'general' ] : [ 'general' ];
	var en;
	inDualNames = true;
	for (var i = 0; i < namespaces.length && en === undefined; i++) {
		var nsKey = namespaces[i] + ':' + key;
		if ($.i18n.t(nsKey, $.extend({}, options, { lng: 'es' })) == value) {
			en = $.i18n.t(nsKey, $.extend({}, options, { lng: 'en' }));
		}
	}
	inDualNames = false;
	if (!en || en == value || en.indexOf(key) > -1) return value;
	return (localStorage['namesFirst'] == 'en') ? en + ' (' + value + ')' : value + ' (' + en + ')';
});

window.toggleNamesFirst = function() {
	localStorage['namesFirst'] = (localStorage['namesFirst'] == 'en') ? 'es' : 'en';
	window.location.reload();
};

var languageOptions = [
	{text: "Español",value: "es",selected: (localStorage['lang'] == "es" ? true : false), description: " ",imageSrc: ((isRoot) ? "" : "../")+"files/images/flags/mx.png"},
	{text: "English",value: "en",selected: (localStorage['lang'] == "en" ? true : false), description: " ",imageSrc: ((isRoot) ? "" : "../")+"files/images/flags/en.png"},
	{text: "Deutsch",value: "de",selected: (localStorage['lang'] == "de" ? true : false),description: " ",imageSrc: ((isRoot) ? "" : "../")+"files/images/flags/de.png"},
	{text: "Русский",value: "ru",selected: (localStorage['lang'] == "ru" ? true : false),description: " ",imageSrc: ((isRoot) ? "" : "../")+"files/images/flags/ru.png"},
	{text: "Polski",value: "pl",selected: (localStorage['lang'] == "pl" ? true : false),description: " ",imageSrc: ((isRoot) ? "" : "../")+"files/images/flags/pl.png"},
	{text: "Français",value: "fr",selected: (localStorage['lang'] == "fr" ? true : false),description: " ",imageSrc: ((isRoot) ? "" : "../")+"files/images/flags/fr.png"}
];

window.changeLang = function(lang) {
	if(localStorage['lang'] != lang) {
		localStorage['lang'] = lang;
		window.location.reload();
	}
};

$(function() {
	$('#lang-switcher').ddslick({
		data: languageOptions,
		width: 150,
		onSelected: function(obj){
			changeLang(obj.selectedData.value);
		}
	});
	if (localStorage['lang'] == 'es') {
		var first = (localStorage['namesFirst'] == 'en') ? 'Inglés' : 'Español';
		$('#lang').append('<div id="names-first"><a href="#" onclick="toggleNamesFirst(); return false;">Nombres: ' + first + ' primero ⇄</a></div>');
	}
});

jQuery.cachedScript = function( url, options ) {
	options = $.extend( options || {}, {
		dataType: "script",
		cache: true,
		url: url
	});
	return jQuery.ajax( options );
};
