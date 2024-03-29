'use strict';
var yeoman = require('yeoman-generator');
var path = require('path');
var chalk = require('chalk');
var fs = require('fs');
var _ = require('lodash');
var yosay = require('yosay');

module.exports = yeoman.generators.Base.extend({

    props : {},

    _showHelp: function (argument) {
        console.error("I would show help here, if I knew what I was talking about");
        process.exit(0);
    },

    _detectType: function() {
        if(fs.exists(this.destinationPath('package.json'))) {
            return require(this.destinationPath('package.json')).generator.viewEngine;
        }
        return "ejs";
    },

    constructor: function () {
        yeoman.generators.Base.apply(this, arguments);

        this.argument('entity-name', {
            desc: 'Tag name of the element to generate',
            required: false
        });

    },

    prompting: {

        askForEntityName: function() {

            var prompts = [];
            if ( this.entityName )
            return true;

            var done = this.async();

            prompts.push({
                type: 'input',
                name: 'entityName',
                message: 'Please enter the name of your entity',
                default: 'tux-element'
            });

            this.prompt(prompts, function(props) {
                _.merge(this.props, props);
                done();
            }.bind(this));
        },

        askForEntityType: function() {

            var prompts = []
            var done = this.async();
            prompts.push({
                type:'list',
                name:'entityType',
                message:'Please select the type of entity you\'re generating',
                choices: [ 'element', 'behavior' ],
                default: 'element'
            });

            this.prompt(prompts, function(props) {
                _.merge(this.props, props);
                done();
            }.bind(this));
        },

        askForOtherThings: function() {
            var prompts = [];

            if (this.props.entityType === "element") {
                prompts.push({
                    type: 'confirm',
                    name: 'generateElementBehavior',
                    message: 'Would you like me to generate a corrosponding behavior for this element (recommended)?',
                    default: true
                });
            }
            prompts.push({
                type: 'input',
                name: 'version',
                message: 'Give your element a version number',
                default: '0.0.0'
            });

            if (fs.existsSync(this.destinationPath('elements/elements.html'))) {
                prompts.push({
                    type: 'confirm',
                    name: 'addToElements',
                    message: 'I can automatically add '
                    + chalk.bold.white(this.entityName) + ' into elements/elements.html'
                    +' would you like me to do that?',
                    default: false
                });
            }
            else {
                this.props.addToElements = false;
            }

            prompts.push({
                type: 'list',
                name: 'viewEngine',
                message: 'Which templating (view) engine do you want to use?',
                choices: [ 'html', 'ejs', 'jade'],
                default: this.props.viewEngine
            });

            var chooseDestDir = function chooseDestDir(dirList) {
                for(var idx in dirList) {
                    var d = dirList[idx];
                    if(fs.existsSync(this.destinationPath(d))
                    && fs.statSync(this.destinationPath(d)).isDirectory())
                    return d;
                }
                return '.';
            }.bind(this);

            this.props.basePath = chooseDestDir(['app/polymer/elements', 'app/modules', 'app/elements']);

            prompts.push({
                type: 'input',
                name: 'basePath',
                message: 'Please give me a base-path where you want the module to be generated',
                default: this.props.basePath
            });

            prompts.push({
                type: 'confirm',
                name: 'skipInstall',
                message: 'Would you like me to skip running npm install & bower install?',
                default: true
            });


            var done = this.async();
            this.prompt(prompts, function(props) {
                _.merge(this.props, props);
                done();
            }.bind(this));

        }

    },

    configuring: function() {
        this.log('configuring...')
        this.props.addToElements = false;
        this.props.viewEngine =  this._detectType();
        if(this.props.entityType === "behavior" || this.props.generateElementBehavior) {
            this.props.behaviorName = this.props.entityName;
            if(this.props.behaviorName.substr(0, 4).toLowerCase() === 'tux-') {
                this.props.behaviorName = this.props.behaviorName.substr(4);
            }
            if(this.props.behaviorName.indexOf('-behavior') <= 0) {
                this.props.behaviorName = this.props.behaviorName+ '-behavior';
            }
        }
        this.props.entityNameCamel = _.camelCase(this.props.entityName);
        this.props.entityNameCapital = _.capitalize(_.camelCase(this.props.entityName));
        this.props.behaviorNameCamel = _.camelCase(this.props.behaviorName);
        this.props.behaviorNameCapital = _.capitalize(_.camelCase(this.props.behaviorName));
        //  x-foo/x-foo.html

        this.props.pathToEntity = path.join(this.props.basePath , this.props.entityName, this.props.entityName);
        this.props.pathToBower = '/bower_components';
        this.props.pathToElements = path.relative(
            path.dirname(this.props.pathToEntity),
            path.join(process.cwd(), this.props.basePath)
        );
        this.props.pathToScripts = path.relative(
            path.dirname(this.props.pathToEntity),
            path.join(process.cwd(), this.props.basePath)
        );
    },

    writing: function() {
        this.log(yosay(
            'Happy to generate ' + chalk.bold.yellow(this.props.entityName) + ' for you.'
        ));
        this.fs.copyTpl(this.templatePath('._' + this.props.entityType + 'Name.html'),
        this.destinationPath(this.props.pathToEntity+'.html'), this.props, { delimiter: '\?' });
        this.fs.copyTpl(this.templatePath('._' + this.props.entityType + 'Name-style.html'),
        this.destinationPath(this.props.pathToEntity+'-style.html'), this.props, { delimiter: '\?' });
        if(this.props.generateElementBehavior) {
            this.fs.copyTpl(this.templatePath('._behaviorName.html'),
            this.destinationPath(this.props.pathToEntity+ "-behavior.html"), this.props, { delimiter: '\?'});
        }
        // TODO: insert demo template stuff
    },

    install: function () {
        if (!this.props.skipInstall) {
            this.installDependencies();
        }
        else {
            this.log('Skipping dependencies installation, you can run '
            + chalk.bold.yellow('npm install') + ' and ' + chalk.bold.yellow('bower install')
            + ' at your leisure');
        }
    }
});
