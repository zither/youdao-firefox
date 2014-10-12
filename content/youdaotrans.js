var fasttransk = {
	transurl: null,
	selected: null,
	prompts: Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService),
	prefs: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.youdaotrans."),
	resto: null,
	resfrom: null,
	labto: null,
	labinfo: null,
	sfrombundle: function(str) {
		return Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService).createBundle("chrome://youdaotrans/locale/youdaotrans.properties").GetStringFromName(str);
	},	
	
	openprefs: function() {
		window.openDialog("chrome://youdaotrans/content/youdaotransprefs.xul","","centerscreen");
	},


	record: function(){
		var a = fasttransk.resfrom.value;
		var button = document.getElementById("buttonrecord");
		button.disabled=1;
		var gtans = new XMLHttpRequest(); 
		var url="http://dict.youdao.com/wordbook/ajax?action=addword&q="+a+"&date=";
		var parameters=Date().toString();
		gtans.open('GET', url+encodeURIComponent(parameters), true);
		gtans.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		gtans.setRequestHeader("Connection", "close");
		gtans.send(null);


		gtans.onreadystatechange = function() {                     
			if (gtans.readyState==4 && gtans.status == 200) {
				data=gtans.responseText;
				data=JSON.parse(data);
				if (data.message == "adddone")
				{
					fasttransk.prompts.alert(window, "Youdao Translate", fasttransk.sfrombundle('wordbookstatus_1'));
				}
				if (data.message == "editdone")
				{
					fasttransk.prompts.alert(window, "Youdao Translate", fasttransk.sfrombundle('wordbookstatus_0'));
				}
				if (data.message == "nouser")
				{
					fasttransk.prompts.alert(window, "Youdao Translate", fasttransk.sfrombundle('wordbookstatus_nouser'));
				}

			} else if(gtans.status != 200) {
				fasttransk.labinfo.value = fasttransk.sfrombundle('error');
				fasttransk.afterresp();
			}
		}
		 button.disabled = 0;


},


	openresult: function(mode) {
		if((fasttransk.selected=='')&&(mode==1)){
			openUILink("http://translate.google.com/translate?u="+fasttransk.transurl+"&sl="+fasttransk.prefs.getCharPref("langfrom")+"&tl="+fasttransk.prefs.getCharPref("langto"));
		} else {
			if(mode==0){
				fasttransk.selected=document.commandDispatcher.focusedWindow.getSelection().toString();
			}
			window.openDialog("chrome://youdaotrans/content/youdaotransresult.xul","fasttrans","centerscreen,dialog=no");
		}
	}, 
	
	realtimer: Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer),
	translated: false,
	
	realtime: function(e) {
		if(fasttransk.prefs.getBoolPref("realtime")) {
			if(fasttransk.slicestep>fasttransk.resfrom.value.length) {
				fasttransk.realtimer.cancel();
				if((e.charCode==32) || (e.keyCode==13)){
					if(!fasttransk.translated) {
						fasttransk.translate();
						
					}
				} else {
					if(!fasttransk.translated) {
						fasttransk.realtimer.initWithCallback(fasttransk.translate,1500,Components.interfaces.nsITimer.TYPE_ONE_SHOT);
					}
					fasttransk.translated = false;
				}
			}
		}
	},

	insertaudio: function(){  
		var a = fasttransk.resfrom.value;
		return '<html:embed xmlns:html="http://www.w3.org/1999/xhtml" width="15" height="15" align="absmiddle" wmode="transparent" src="http://cidian.youdao.com/chromeplus/voice.swf" loop="false" menu="false" quality="high" bgcolor="#ffffff" swliveconnect="true" allowscriptaccess="sameDomain" flashvars="audio=http://dict.youdao.com/speech?audio='+a+'" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer"></html:embed>' ;
},

	moreurl: function(){
		var a = fasttransk.resfrom.value;
		var win = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('navigator:browser');
    	win.gBrowser.selectedTab = win.gBrowser.addTab('http://dict.youdao.com/search?q='+a);
},

	voice2: function(){
		var b = document.getElementById('more');
		var a = fasttransk.resfrom.value;
		var url = "audio=http://dict.youdao.com/speech?audio="+a;
		var aa = document.getElementById('speach_flash');
		var bb = aa.cloneNode(true);
		b.value = "Read moere about < "+a.slice(0, 12)+"..."+" >";

		if (fasttransk.prefs.getBoolPref("notsound")==false){
			bb.setAttribute("flashvars", url);
		}else{
			bb.setAttribute("flashvars", "")
		}
		aa.remove();
		document.getElementById("voiceb").appendChild(bb);

},


	login: function(){
		var win = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('navigator:browser');
		win.gBrowser.selectedTab = win.gBrowser.addTab('http://dict.youdao.com/wordbook/wordlist?keyfrom=smallpic');


},

	translate: function() {
		if(fasttransk.resfrom.value.length != 0) {
			if(fasttransk.resfrom.value.length > 10000) {
				fasttransk.prompts.alert(window, "Youdao Translate", fasttransk.sfrombundle('texttoolong'));
			} else {
				var button = document.getElementById("buttontranslate");
				button.disabled=1;
				fasttransk.labinfo.value = fasttransk.sfrombundle('wait');
				var ttext = fasttransk.resfrom.value.replace(/\n/g,'%0A');
				fasttransk.transText = ttext.replace(/\t/g,' ');
				fasttransk.askgoogle();
				fasttransk.translated = true;
			}
		}
	},
	
    transText: null,
	slicestep: 1000,
	googleresp: '',

	askgoogle: function() {
		text = fasttransk.transText;
		fasttransk.voice2();
		var gtans = new XMLHttpRequest(); 
		var data=null;
		var url="http://dict.youdao.com/fsearch?client=deskdict&keyfrom=chrome.extension&q=" + encodeURIComponent(text) + "&pos=-1&doctype=xml&xmlVersion=3.2&dogVersion=1.0&vendor=unknown&appVer=3.1.17.4208&le=eng";
		gtans.open('GET', url, true);
		gtans.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		gtans.setRequestHeader("Connection", "close");
		gtans.send(null);
		gtans.onreadystatechange = function() {                     
			if (gtans.readyState==4 && gtans.status == 200) {
				data=gtans.responseText;
				fasttransk.googleresp = fasttransk.parseXml(data);
                fasttransk.resto.value=fasttransk.googleresp;
                fasttransk.labinfo.value='';
                fasttransk.afterresp();
			} else if(gtans.status != 200) {
				fasttransk.labinfo.value = fasttransk.sfrombundle('error');
				fasttransk.afterresp();
			}
		}
		delete gtans;
	},
    parseXml: function(xml){
        var data = "";
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(xml, 'text/xml');
        var trans = xmlDoc.getElementsByTagName("translation");
        for (var i = 0; i < trans.length; i++) {
            data += trans[i].getElementsByTagName("content")[0].childNodes[0].nodeValue + "\n";
        }
        return data;
    },
	
	afterresp: function() {
		var button = document.getElementById("buttontranslate");
		button.disabled=0;
		fasttransk.googleresp = '';
		document.getElementById("resfrom").focus();
	},
	
	resultload: function() {
		fasttransk.labinfo = document.getElementById("labinfo");
		fasttransk.labto = document.getElementById("labto");
		fasttransk.resfrom = document.getElementById("resfrom");
		fasttransk.resto = document.getElementById("resto");
		fasttransk.resfrom.value = window.opener.fasttransk.selected.trim();
		fasttransk.resfrom.focus();
		fasttransk.translate();
	},

	resultclose: function() {
		fasttransk.resfrom.value='';
		fasttransk.resto.value='';
		fasttransk.labinfo.value='';
		fasttransk.selected='';
	},
	
	init: function() {
		if(window.location == 'chrome://browser/content/browser.xul'){
			var menuel = document.getElementById("contentAreaContextMenu");
			if(menuel != null) menuel.addEventListener("popupshowing", fasttransk.menuchange, false);
		}
	},
	
	goodurl: function(url) {
		if((url.substr(0,7)=="http://")&&(url.indexOf("http://localhost/")==-1)&&(url.indexOf("http://127.0.0.1")==-1)&&(url.indexOf("http://192.168.")==-1)&&(url.indexOf("http://translate.google")==-1)){
			fasttransk.transurl = url;
			return true;
		} else {
			return false;
		}
	},


	menuchange: function(event) {
		var menuh = false;
		var transmenu = document.getElementById("menutranslate");
		if(gContextMenu.isTextSelected) {
			fasttransk.selected = document.commandDispatcher.focusedWindow.getSelection().toString();
            var newlab = "Youdao translate"
			transmenu.setAttribute("label",newlab);
		} else if(gContextMenu.onLink){
			if(fasttransk.goodurl(gContextMenu.linkURL)){
				fasttransk.selected='';
				transmenu.setAttribute("label",fasttransk.sfrombundle('translink'));
			} else {
				menuh = true;
			}
		} else {
			if(fasttransk.goodurl(gBrowser.selectedBrowser.contentDocument.location.href)){
				fasttransk.selected='';
				transmenu.setAttribute("label",fasttransk.sfrombundle('transall'));
			} else {
				menuh = true;
			}
		}
		transmenu.setAttribute("hidden",menuh);
		document.getElementById("septrans").setAttribute("hidden",menuh);		
	}
}

window.addEventListener("load", fasttransk.init, true);
fasttransk.prefswin = {
	windowload: function() {
		if(fasttransk.prefs.getBoolPref("realtime")) {
			document.getElementById("chrealtime").checked = 1;
		} else {
			document.getElementById("chrealtime").checked = 0;
		}

		if(fasttransk.prefs.getBoolPref("notshowpop")) {
			document.getElementById("notshowpop").checked = 0;
		} else {
			document.getElementById("notshowpop").checked = 1;
		}
		
		if(fasttransk.prefs.getBoolPref("notsound")) {
			document.getElementById("notsound").checked = 0;
		} else {
			document.getElementById("notsound").checked = 1;
		}

		//fasttransk.prefswin.lfrom = document.getElementById("lfrom");
		//fasttransk.prefswin.lto = document.getElementById("lto");
		//fasttransk.prefswin.lfrom.removeAllItems();
		//fasttransk.prefswin.lto.removeAllItems();
		//var j=0;
		//for(var i in fasttransk.langs) {
		//	fasttransk.prefswin.lfrom.appendItem(fasttransk.langs[i],i);
		//	fasttransk.prefswin.lto.appendItem(fasttransk.langs[i],i);
		//	if(fasttransk.prefs.getCharPref("langfrom")==i) {
		//		fasttransk.prefswin.lfrom.selectedIndex=j;
		//	} else if(fasttransk.prefs.getCharPref("langto")==i) {
		//		fasttransk.prefswin.lto.selectedIndex=j;
		//	}
		//	j++;
		//}
	},
	prefssave: function() {
		if(document.getElementById("chrealtime").checked){
			fasttransk.prefs.setBoolPref("realtime",true);
		} else {
			fasttransk.prefs.setBoolPref("realtime",false);
		}

		if(document.getElementById("notshowpop").checked){
			fasttransk.prefs.setBoolPref("notshowpop",false);
		} else {
			fasttransk.prefs.setBoolPref("notshowpop",true);
		}

		if(document.getElementById("notsound").checked){
			fasttransk.prefs.setBoolPref("notsound",false);
		} else {
			fasttransk.prefs.setBoolPref("notsound",true);
		}

		//if(fasttransk.prefswin.lto.value == fasttransk.prefswin.lfrom.value) {
		//	fasttransk.prompts.alert(window, "Fast Translate", difflang);
		//	return false;
		//} else {
		//	fasttransk.prefs.setCharPref("langfrom",fasttransk.prefswin.lfrom.value);
		//	fasttransk.prefs.setCharPref("langto",fasttransk.prefswin.lto.value);
		//	return true;
		//}
	}
}
