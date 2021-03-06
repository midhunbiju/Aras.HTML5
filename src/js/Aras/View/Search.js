/*  
  Copyright 2017 Processwall Limited

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
 
  Company: Processwall Limited
  Address: The Winnowing House, Mill Lane, Askham Richard, York, YO23 3NW, United Kingdom
  Tel:     +44 113 815 3440
  Web:     http://www.processwall.com
  Email:   support@processwall.com
*/

define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dijit/layout/BorderContainer',
	'dijit/layout/ContentPane',
	'dijit/ToolbarSeparator',
	'dijit/form/NumberSpinner',
	'dijit/form/TextBox',
	'dijit/Tooltip',
	'./Control',
	'./Toolbar',
	'./Button',
	'./Grid'
], function(declare, lang, BorderContainer, ContentPane, ToolbarSeparator, NumberSpinner, TextBox, Tooltip, Control, Toolbar, Button, Grid) {
	
	return declare('Aras.View.Search', [BorderContainer, Control], {
	
		Toolbar: null,
		
		SearchButton: null,
		
		PageSize: null,
		
		NextButton: null,
		
		PreviousButton: null,
		
		QueryString: null,
				
		Grid: null,
		
		constructor: function() {
			this.inherited(arguments);
		},
				
		startup: function() {
			this.inherited(arguments);

			dijit.Tooltip.defaultPosition = ['above', 'below'];
			
			// Create Toolbar
			this.Toolbar = new Toolbar({ region: 'top' });
			this.addChild(this.Toolbar);
			
			// Create Search Button
			this.SearchButton = new Button({ iconClass: 'searchIcon'});
			this.Toolbar.addChild(this.SearchButton);
			var searchtooltip = new Tooltip({connectId: this.SearchButton.id, label: 'Refresh'});
			
			// Add Separator
			this.Toolbar.addChild(new ToolbarSeparator());
			
			// Create Page Size
			this.PageSize = new NumberSpinner({ value:25, constraints: { min:5, max:100, places:0 }, style: 'width:40px; margin-left:5px; margin-right:5px;'});
			this.Toolbar.addChild(this.PageSize);
			var pagesizetooltip = new Tooltip({connectId: this.PageSize.id, label: 'Page Size'});
			
			// Create Next Page Button
			this.NextButton = new Button({ iconClass: 'nextPageIcon'});
			this.Toolbar.addChild(this.NextButton);
			var nextpagetooltip = new Tooltip({connectId: this.NextButton.id, label: 'Next Page'});
			
			// Create Previous Page Button
			this.PreviousButton = new Button({ iconClass: 'previousPageIcon'});
			this.Toolbar.addChild(this.PreviousButton);
			var prevpagetooltip = new Tooltip({connectId: this.PreviousButton.id, label: 'Previous Page'});
			
			// Add Separator
			this.Toolbar.addChild(new ToolbarSeparator());
			
			// Create QueryString
			this.QueryString = new TextBox({intermediateChanges: true, style: 'width:150px; margin-left:5px; margin-right:5px;'});
			this.Toolbar.addChild(this.QueryString);
			var querystringtooltip = new Tooltip({connectId: this.QueryString.id, label: 'Search String'});
			
			// Add Separator
			this.Toolbar.addChild(new ToolbarSeparator());
			
			// Create Grid			
			this.Grid = new Grid({style: 'height: 100%; width: 100%', region: 'center', gutters: false });		
			this.addChild(this.Grid);
		},
		
		OnViewModelLoaded: function() {
			this.inherited(arguments);

			if (this.ViewModel != null)
			{
				// Set Grid ViewModel
				this.Grid.set("ViewModel", this.ViewModel.Grid);
				
				// Set Search Button ViewModel			
				this.SearchButton.set("ViewModel", this.ViewModel.Refresh);	
				
				// Set Page Size
				this.PageSize.set("value", this.ViewModel.PageSize);

				// Set PreviousPage Button ViewModel
				this.PreviousButton.set("ViewModel", this.ViewModel.PreviousPage);	
			
				// Set NextPage Button ViewModel
				this.NextButton.set("ViewModel", this.ViewModel.NextPage);	
				
				// Watch for changes in PageSize Control
				this.PageSize.watch("value", lang.hitch(this, function(name, oldValue, newValue) {
									
					if (isNaN(newValue))
					{
						this.PageSize.set("value", oldValue);
					}
					else
					{
						var newnumber = Number(newValue);
						var oldnumber = Number(oldValue);
				
						if (oldnumber !== newnumber)
						{						
							// Update ViewModel Value
							this.ViewModel.set('PageSize', newnumber);
							this.ViewModel.Write();
						}
					}
				}));
				
				// Watch for changes in PageSize Model
				this.ViewModel.watch('PageSize', lang.hitch(this, function(name, oldValue, newValue) {
					
					var newnumber = Number(newValue);
					var oldnumber = Number(oldValue);
				
					if (oldnumber !== newnumber)
					{	
						// Update Control
						this.PageSize.set("value", newnumber);
					}
					
				}));
				
				// Set QueryString
				this.QueryString.set("value", this.ViewModel.QueryString);
				
				// Watch for changes in QueryString
				this.QueryString.watch("value", lang.hitch(this, function(name, oldValue, newValue) {
									
					if (oldValue !== newValue)
					{						
						// Update ViewModel Value
						this.ViewModel.set('QueryString', newValue);
						this.ViewModel.Write();
					}
					
				}));
			}
		}
	});
});