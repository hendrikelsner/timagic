(function () {
	/**
	 * Requirements
	 */
	var cli = require('cli');
	var Q = require('q');
	var path = require('path');
	var logic = require('./logic');
	var config = require('./config');

	/**
	 * CLI Configuration
	 */
	var appname = 'TiMagic';
	var currVersion = '0.1.0';
	var author = 'Hendrik Elsner';
	var email = '321hendrik@gmail.com';

	cli.enable('version');

	cli.setApp(appname, currVersion + ' created by ' + author + ' (' + email + ')');

	cli.parse({
		'iosv': ['i', 'Set ios version for build', 'string'],
		'debug': ['d', 'Show command output for debugging'],
		'shadow': ['s', 'Use TiShadow (install with "npm install -g tishadow")'],
		'suffix': ['x', 'suffix to use for microsite path (e.g. app001/test -> http://base.url/app001/test)', 'string'],
		'build': ['b', 'use with microsite to create binaries too']
	}, ['clean', 'apk', 'ipa', 'ipad', 'iphone', 'microsite']);

	/**
	 * Main execution
	 */
	cli.main(function(args, options) {
		cli.info(appname + ' created by ' + author + ' (' + email + ') ');

		var env = {
			cwd: process.cwd(),
			folderName: process.cwd().split('/').pop(),
			execDir: process.argv[1]
		};

		var params = {
			command: cli.command,
			args: args,
			options: options
		};

		var settings = {
			adb_path: '/Applications/android-sdk-macosx/platform-tools/adb',
			apk_output_path: path.join(env.cwd, 'dist'),
			keystore_path: false,
			keystore_alias: false,
			keystore_pw: false,
			ipa_output_path: path.join(env.cwd, 'dist'),
			distribution_name: false,
			pp_uuid: false,
			distribution_path: path.join(env.cwd, 'dist_sites'),
			distribution_base_url: false,
			latest_ios_version: ''
		};

		// overwrite with info from config
		for (var key in settings) {
			if (config[key]) {
				settings[key] = config[key];
			}
		}

		var tiapp;
		// get tiappxml data<
		require('./tiapp').init(env.cwd)
			// init tiapp module and assign to var
			.then(function (data) {
				tiapp = data;
				return true;
			})
			// get latest installed ios sdk version
			.then(logic.getLatestIosSdkVersion)
			.then(function (data) {
				if (data) {
					settings['latest_ios_version'] = data;
				}
				return true;
			})
			// Run method code
			.then(function () {

				var methodStrings = {
					'test': {
						indicatorString: 'Testing'
					},
					'clean': {
						indicatorString: 'Cleaning'
					},
					'apk': {
						indicatorString: 'Creating APK'
					},
					'ipa': {
						indicatorString: 'Creating IPA'
					},
					'microsite': {
						indicatorString: 'Creating Microsite'
					},
					'iphone': {
						singleLog: 'Starting iPhone Simulator',
					},
					'ipad': {
						singleLog: 'Starting iPad Simulator'
					}
				};

				var indicatorString = methodStrings[cli.command].indicatorString;
				if (indicatorString) {
					cli.spinner(indicatorString + '...');
				}

				var singleLog = methodStrings[cli.command].singleLog;
				if (singleLog) {
					cli.debug(singleLog);
				}

				logic[cli.command](env, settings, tiapp, params)
					.then(function (data) {
						if (indicatorString) {
							cli.spinner(indicatorString + '...done!', true);
						}
						// console.log(data);
					})
					.catch(function (err) {
						if (indicatorString) {
							cli.spinner(indicatorString + '...failed!', true);
						}
						cli.error(err);
					})
				;
			})
			.catch(function (err) {
				cli.error(err);
			})
		;
	});
}).call(this);