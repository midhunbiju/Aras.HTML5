/*
  Aras.HTML5 provides a HTML5 client library to build Aras Innovator Applications

  Copyright (C) 2015 Processwall Limited.

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published
  by the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see http://opensource.org/licenses/AGPL-3.0.
 
  Company: Processwall Limited
  Address: The Winnowing House, Mill Lane, Askham Richard, York, YO23 3NW, United Kingdom
  Tel:     +44 113 815 3440
  Email:   support@processwall.com
*/

define([
	'dojo/_base/declare',
	'dojo/request',
	'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/json',
	'dojo/when',
	'dojo/Deferred',
	'./Control',
	'./Command'
], function(declare, request, lang, array, json, when, Deferred, Control, Command) {
	
	return declare('Aras.ViewModel.Session', null, {
		
		Database: null, 
		
		Username: null,
		
		Password: null,
		
		_controlCache: new Object(),
		
		_commandCache: new Object(),
		
		constructor: function(args) {
			declare.safeMixin(this, args);
		},
		
		_processCommands: function(Commands)
		{
			array.forEach(Commands, lang.hitch(this, function(command) {
					
				if (this._commandCache[command.ID] === undefined)
				{
					// Create new Command
					this._commandCache[command.ID] = new Command(this, command.ID, command.Name, command.CanExecute);
				}
				else
				{
					// Set Name
					this._commandCache[command.ID].set('Name', command.Name);
				
					// Set CanExecute
					this._commandCache[command.ID].set('CanExecute', command.CanExecute);	
				}
			}));		
		},
		
		_processResponse: function(Response) {
	
			// Create a Deferred for each Controls that is not already in Cache
			array.forEach(Response.ControlQueue, lang.hitch(this, function(control) {
						
				// Ensure Control is in Cache
				if (this._controlCache[control.ID] === undefined)
				{
					this._controlCache[control.ID] = new Deferred();	
				}

				// Process attached Commands
				this._processCommands(control.Commands);
			}));	
			
			// Process Command Queue
			this._processCommands(Response.CommandQueue);
			
			// Update Controls
			array.forEach(Response.ControlQueue, lang.hitch(this, function(control) {

				if (this._controlCache[control.ID].declaredClass === undefined)
				{
					// Create new Control
					var newcontrol = new Control(this, control.ID, control);
					
					// Resolve Deferred
					this._controlCache[control.ID].resolve(newcontrol);
					
					// Store new Control in Cache
					this._controlCache[control.ID] = newcontrol;
				}
				else
				{
					// Set new Data in existing Control
					this._controlCache[control.ID].set('Data', control);
				}
			}));

		},
		
		Application: function(Name) {
				return request.put(this.Database.Server.URL + '/applications', 
							   { headers: {'Content-Type': 'application/json', 'Accept': 'application/json'}, 
								 handleAs: 'json',
								 data: json.stringify({ Name: Name })
							   }).then(
				lang.hitch(this, function(result) {

					// Process Response
					this._processResponse(result);
					
					// Process Attached Commands
					this._processCommands(result.Value.Commands);
					
					// Create Application
					if (this._controlCache[result.Value.ID] === undefined)
					{
						this._controlCache[result.Value.ID] = new Control(this, result.Value.ID, result.Value);
					}
					else
					{
						this._controlCache[result.Value.ID].set('Data', result.Value);
					}
										
					return this._controlCache[result.Value.ID];
				}),
				lang.hitch(this, function(error) {
					this.Database.Server.ProcessError(error);
					return null;
				})
			);
		},
		
		Plugin: function(Name, Context) {
				return request.put(this.Database.Server.URL + '/plugins', 
							   { headers: {'Content-Type': 'application/json', 'Accept': 'application/json'}, 
								 handleAs: 'json',
								 data: json.stringify({ Name: Name, Context: Context })
							   }).then(
				lang.hitch(this, function(result) {
				
					// Process Response
					this._processResponse(result);
					
					// Process Attached Commands
					this._processCommands(result.Value.Commands);
					
					// Create Plugin
					if (this._controlCache[result.Value.ID] === undefined)
					{
						this._controlCache[result.Value.ID] = new Control(this, result.Value.ID, result.Value);
					}
					else
					{
						this._controlCache[result.Value.ID].set('Data', result.Value);
					}
					
					return this._controlCache[result.Value.ID];
				}),
				lang.hitch(this, function(error) {
					this.Database.Server.ProcessError(error);
					return null;
				})
			);
		},
		
		_readControl: function(Control) {
		
			request.get(this.Database.Server.URL + '/controls/' + Control.ID, 
						{ headers: {'Accept': 'application/json'}, 
						  handleAs: 'json'
						}).then(
				lang.hitch(this, function(result) {
							
					// Process Response
					this._processResponse(result);
					
					// Process Attached Commands
					this._processCommands(result.Value.Commands);
					
					// Update Data on Control
					Control.set("Data", result.Value);
				}),
				lang.hitch(this, function(error) {
					this.Database.Server.ProcessError(error);
				}));	
		},
		
		Control: function(ID) {
			
			if (ID)
			{			
				return this._controlCache[ID];
			}
			else
			{
				return null;
			}
		},
			
		Command: function(ID) {
			
			if (ID)
			{
				return this._commandCache[ID];
			}
			else
			{
				return null;
			}
		},
		
		Execute: function(Command, Parameters) {
			
			// Execute Command
			request.put(this.Database.Server.URL + '/commands/' + Command.ID + '/execute', 
								{ headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, 
								  handleAs: 'json',
								  data: json.stringify(Parameters)
								}).then(
				lang.hitch(this, function(response){
									
					// Process Response
					this._processResponse(response);
				}),
				lang.hitch(this, function(error) {
					this.Database.Server.ProcessError(error);
				})
			);				
		},
		
		_writeControl: function(Control) {
			
			// Send to Server
			request.put(this.Database.Server.URL + '/controls/' + Control.ID, 
								{ headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, 
								  handleAs: 'json',
								  data: json.stringify(Control.Data)
								}).then(
				lang.hitch(this, function(response){
									
					// Process Response
					this._processResponse(response);
				}),
				lang.hitch(this, function(error) {
					this.Database.Server.ProcessError(error);
				})
			);				
		}
		
	});
});