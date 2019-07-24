webpackJsonp([36],{

/***/ 2033:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CoreLoginCredentialsPageModule", function() { return CoreLoginCredentialsPageModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_ionic_angular__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__credentials__ = __webpack_require__(2172);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__ngx_translate_core__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__components_components_module__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__directives_directives_module__ = __webpack_require__(14);
// (C) Copyright 2015 Martin Dougiamas
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};






var CoreLoginCredentialsPageModule = /** @class */ (function () {
    function CoreLoginCredentialsPageModule() {
    }
    CoreLoginCredentialsPageModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_2__credentials__["a" /* CoreLoginCredentialsPage */]
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_4__components_components_module__["a" /* CoreComponentsModule */],
                __WEBPACK_IMPORTED_MODULE_5__directives_directives_module__["a" /* CoreDirectivesModule */],
                __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["l" /* IonicPageModule */].forChild(__WEBPACK_IMPORTED_MODULE_2__credentials__["a" /* CoreLoginCredentialsPage */]),
                __WEBPACK_IMPORTED_MODULE_3__ngx_translate_core__["b" /* TranslateModule */].forChild()
            ]
        })
    ], CoreLoginCredentialsPageModule);
    return CoreLoginCredentialsPageModule;
}());

//# sourceMappingURL=credentials.module.js.map

/***/ }),

/***/ 2172:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return CoreLoginCredentialsPage; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_ionic_angular__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ngx_translate_core__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__providers_app__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__providers_events__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__providers_sites__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__providers_utils_dom__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__providers_helper__ = __webpack_require__(82);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__angular_forms__ = __webpack_require__(24);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__configconstants__ = __webpack_require__(67);
// (C) Copyright 2015 Martin Dougiamas
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};










/**
 * Page to enter the user credentials.
 */
var CoreLoginCredentialsPage = /** @class */ (function () {
    function CoreLoginCredentialsPage(navCtrl, navParams, fb, appProvider, sitesProvider, loginHelper, domUtils, translate, eventsProvider, modalCtrl) {
        this.navCtrl = navCtrl;
        this.appProvider = appProvider;
        this.sitesProvider = sitesProvider;
        this.loginHelper = loginHelper;
        this.domUtils = domUtils;
        this.translate = translate;
        this.eventsProvider = eventsProvider;
        this.modalCtrl = modalCtrl;
        this.siteChecked = false;
        this.pageLoaded = false;
        this.isBrowserSSO = false;
        this.isFixedUrlSet = false;
        this.urlList = [];
        this.selectedSite = -1;
        this.fixedDisplay = 'buttons';
        this.showKeyboard = false;
        this.filter = '';
        this.eventThrown = false;
        this.viewLeft = false;
        // this.siteUrl = navParams.get('siteUrl');
        // this.siteConfig = navParams.get('siteConfig');
        this.urlToOpen = navParams.get('urlToOpen');
        this.credForm = fb.group({
            username: [navParams.get('username') || '', __WEBPACK_IMPORTED_MODULE_8__angular_forms__["h" /* Validators */].required],
            password: ['', __WEBPACK_IMPORTED_MODULE_8__angular_forms__["h" /* Validators */].required]
        });
        // From CoreLoginSitePage
        this.showKeyboard = !!navParams.get('showKeyboard');
        var url = '';
        // Load fixed sites if they're set.
        if (this.loginHelper.hasSeveralFixedSites()) {
            this.fixedSites = this.loginHelper.getFixedSites();
            this.fixedDisplay = __WEBPACK_IMPORTED_MODULE_9__configconstants__["a" /* CoreConfigConstants */].multisitesdisplay;
            // Autoselect if not defined.
            if (['list', 'listnourl', 'select', 'buttons'].indexOf(this.fixedDisplay) < 0) {
                this.fixedDisplay = this.fixedSites.length > 8 ? 'list' : (this.fixedSites.length > 3 ? 'select' : 'buttons');
            }
            this.filteredSites = this.fixedSites;
            url = this.fixedSites[0].url;
        }
    }
    /**
     * View loaded.
     */
    CoreLoginCredentialsPage.prototype.ionViewDidLoad = function () {
        var _this = this;
        var modal = this.domUtils.showModalLoading();
        this.sitesProvider.getSiteUrlList().then(function (data) {
            data.forEach(function (element) {
                var oneObj = {
                    id: element.id,
                    arabic_name: element.arabic_name,
                    english_name: element.english_name,
                    url: element.url
                };
                _this.urlList.push(oneObj);
            });
        }, function (err) {
            _this.domUtils.showErrorModal('core.login.errorgeturllist', true);
        }).finally(function () {
            modal.dismiss();
            _this.pageLoaded = true;
        });
    };
    /**
     * Change site url to connect.
     *
     * @param {Event} e The URL to connect to.
     */
    CoreLoginCredentialsPage.prototype.onSiteChange = function (e) {
        var _this = this;
        var urlToConnect = '';
        this.urlList.forEach(function (element) {
            if (element.id == _this.selectedSite) {
                urlToConnect = element.url;
            }
        });
        this.connect(urlToConnect);
    };
    // From CoreLoginSitePage
    /**
     * Try to connect to a site.
     *
     * @param {string} url The URL to connect to.
     */
    CoreLoginCredentialsPage.prototype.connect = function (url) {
        var _this = this;
        this.siteChecked = false;
        this.appProvider.closeKeyboard();
        if (!url) {
            this.domUtils.showErrorModal('core.login.siteurlrequired', true);
            return;
        }
        if (!this.appProvider.isOnline()) {
            this.domUtils.showErrorModal('core.networkerrormsg', true);
            return;
        }
        var modal = this.domUtils.showModalLoading(), siteData = this.sitesProvider.getDemoSiteData(url);
        if (siteData) {
            // It's a demo site.
            this.sitesProvider.getUserToken(siteData.url, siteData.username, siteData.password).then(function (data) {
                return _this.sitesProvider.newSite(data.siteUrl, data.token, data.privateToken).then(function () {
                    return _this.loginHelper.goToSiteInitialPage();
                }, function (error) {
                    _this.domUtils.showErrorModal(error);
                });
            }, function (error) {
                _this.loginHelper.treatUserTokenError(siteData.url, error, siteData.username, siteData.password);
            }).finally(function () {
                modal.dismiss();
            });
        }
        else {
            // Not a demo site.
            this.sitesProvider.checkSite(url).then(function (result) {
                if (result.warning) {
                    _this.domUtils.showErrorModal(result.warning, true, 4000);
                }
                if (_this.loginHelper.isSSOLoginNeeded(result.code)) {
                    // SSO. User needs to authenticate in a browser.
                    _this.loginHelper.confirmAndOpenBrowserForSSOLogin(result.siteUrl, result.code, result.service, result.config && result.config.launchurl);
                }
                else {
                    // this.navCtrl.push('CoreLoginCredentialsPage', { siteUrl: result.siteUrl, siteConfig: result.config });
                    _this.siteUrl = result.siteUrl;
                    _this.siteConfig = result.config;
                    _this.treatSiteConfig();
                    _this.isFixedUrlSet = _this.loginHelper.isFixedUrlSet();
                    if (_this.isFixedUrlSet) {
                        // Fixed URL, we need to check if it uses browser SSO login.
                        _this.checkSite(_this.siteUrl);
                    }
                    else {
                        _this.siteChecked = true;
                        _this.pageLoaded = true;
                    }
                }
            }, function (error) {
                _this.showLoginIssue(url, error);
            }).finally(function () {
                modal.dismiss();
            });
        }
    };
    /**
     * The filter has changed.
     *
     * @param {any} Received Event.
     */
    CoreLoginCredentialsPage.prototype.filterChanged = function (event) {
        var newValue = event.target.value && event.target.value.trim().toLowerCase();
        if (!newValue || !this.fixedSites) {
            this.filteredSites = this.fixedSites;
        }
        else {
            this.filteredSites = this.fixedSites.filter(function (site) {
                return site.name.toLowerCase().indexOf(newValue) > -1 || site.url.toLowerCase().indexOf(newValue) > -1;
            });
        }
    };
    /**
     * Show a help modal.
     */
    CoreLoginCredentialsPage.prototype.showHelp = function () {
        var modal = this.modalCtrl.create('CoreLoginSiteHelpPage');
        modal.present();
    };
    /**
     * Show an error that aims people to solve the issue.
     *
     * @param {string} url The URL the user was trying to connect to.
     * @param {any} error Error to display.
     */
    CoreLoginCredentialsPage.prototype.showLoginIssue = function (url, error) {
        var modal = this.modalCtrl.create('CoreLoginSiteErrorPage', {
            siteUrl: url,
            issue: this.domUtils.getErrorMessage(error)
        });
        modal.present();
    };
    /**
     * View left.
     */
    CoreLoginCredentialsPage.prototype.ionViewDidLeave = function () {
        this.viewLeft = true;
        this.eventsProvider.trigger(__WEBPACK_IMPORTED_MODULE_4__providers_events__["a" /* CoreEventsProvider */].LOGIN_SITE_UNCHECKED, { config: this.siteConfig }, this.siteId);
    };
    /**
     * Check if a site uses local_mobile, requires SSO login, etc.
     * This should be used only if a fixed URL is set, otherwise this check is already performed in CoreLoginSitePage.
     *
     * @param {string} siteUrl Site URL to check.
     * @return {Promise<any>} Promise resolved when done.
     */
    CoreLoginCredentialsPage.prototype.checkSite = function (siteUrl) {
        // this.pageLoaded = false;
        var _this = this;
        // If the site is configured with http:// protocol we force that one, otherwise we use default mode.
        var protocol = siteUrl.indexOf('http://') === 0 ? 'http://' : undefined;
        return this.sitesProvider.checkSite(siteUrl, protocol).then(function (result) {
            _this.siteChecked = true;
            _this.siteUrl = result.siteUrl;
            _this.siteConfig = result.config;
            _this.treatSiteConfig();
            if (result && result.warning) {
                _this.domUtils.showErrorModal(result.warning, true, 4000);
            }
            if (_this.loginHelper.isSSOLoginNeeded(result.code)) {
                // SSO. User needs to authenticate in a browser.
                _this.isBrowserSSO = true;
                // Check that there's no SSO authentication ongoing and the view hasn't changed.
                if (!_this.appProvider.isSSOAuthenticationOngoing() && !_this.viewLeft) {
                    _this.loginHelper.confirmAndOpenBrowserForSSOLogin(result.siteUrl, result.code, result.service, result.config && result.config.launchurl);
                }
            }
            else {
                _this.isBrowserSSO = false;
            }
        }).catch(function (error) {
            _this.domUtils.showErrorModal(error);
        }).finally(function () {
            _this.pageLoaded = true;
        });
    };
    /**
     * Treat the site configuration (if it exists).
     */
    CoreLoginCredentialsPage.prototype.treatSiteConfig = function () {
        if (this.siteConfig) {
            this.siteName = __WEBPACK_IMPORTED_MODULE_9__configconstants__["a" /* CoreConfigConstants */].sitename ? __WEBPACK_IMPORTED_MODULE_9__configconstants__["a" /* CoreConfigConstants */].sitename : this.siteConfig.sitename;
            this.logoUrl = this.siteConfig.logourl || this.siteConfig.compactlogourl;
            this.authInstructions = this.siteConfig.authinstructions || this.translate.instant('core.login.loginsteps');
            this.canSignup = this.siteConfig.registerauth == 'email' && !this.loginHelper.isEmailSignupDisabled(this.siteConfig);
            this.identityProviders = this.loginHelper.getValidIdentityProviders(this.siteConfig);
            if (!this.eventThrown && !this.viewLeft) {
                this.eventThrown = true;
                this.eventsProvider.trigger(__WEBPACK_IMPORTED_MODULE_4__providers_events__["a" /* CoreEventsProvider */].LOGIN_SITE_CHECKED, { config: this.siteConfig });
            }
        }
        else {
            this.siteName = null;
            this.logoUrl = null;
            this.authInstructions = null;
            this.canSignup = false;
            this.identityProviders = [];
        }
    };
    /**
     * Tries to authenticate the user.
     *
     * @param {Event} [e] Event.
     */
    CoreLoginCredentialsPage.prototype.login = function (e) {
        var _this = this;
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        this.appProvider.closeKeyboard();
        // Get input data.
        var siteUrl = this.siteUrl, username = this.credForm.value.username, password = this.credForm.value.password;
        if (!this.siteChecked || this.isBrowserSSO) {
            // Site wasn't checked (it failed) or a previous check determined it was SSO. Let's check again.
            this.checkSite(siteUrl).then(function () {
                if (!_this.isBrowserSSO) {
                    // Site doesn't use browser SSO, throw app's login again.
                    return _this.login();
                }
            });
            return;
        }
        if (!username) {
            this.domUtils.showErrorModal('core.login.usernamerequired', true);
            return;
        }
        if (!password) {
            this.domUtils.showErrorModal('core.login.passwordrequired', true);
            return;
        }
        if (!this.appProvider.isOnline()) {
            this.domUtils.showErrorModal('core.networkerrormsg', true);
            return;
        }
        var modal = this.domUtils.showModalLoading();
        // Start the authentication process.
        this.sitesProvider.getUserToken(siteUrl, username, password).then(function (data) {
            return _this.sitesProvider.newSite(data.siteUrl, data.token, data.privateToken).then(function (id) {
                // Reset fields so the data is not in the view anymore.
                _this.credForm.controls['username'].reset();
                _this.credForm.controls['password'].reset();
                _this.siteId = id;
                return _this.loginHelper.goToSiteInitialPage(undefined, undefined, undefined, undefined, _this.urlToOpen);
            });
        }).catch(function (error) {
            _this.loginHelper.treatUserTokenError(siteUrl, error, username, password);
        }).finally(function () {
            modal.dismiss();
        });
    };
    /**
     * Forgotten password button clicked.
     */
    CoreLoginCredentialsPage.prototype.forgottenPassword = function () {
        this.loginHelper.forgottenPasswordClicked(this.navCtrl, this.siteUrl, this.credForm.value.username, this.siteConfig);
    };
    /**
     * An OAuth button was clicked.
     *
     * @param {any} provider The provider that was clicked.
     */
    CoreLoginCredentialsPage.prototype.oauthClicked = function (provider) {
        if (!this.loginHelper.openBrowserForOAuthLogin(this.siteUrl, provider, this.siteConfig.launchurl)) {
            this.domUtils.showErrorModal('Invalid data.');
        }
    };
    /**
     * Signup button was clicked.
     */
    CoreLoginCredentialsPage.prototype.signup = function () {
        this.navCtrl.push('CoreLoginEmailSignupPage', { siteUrl: this.siteUrl });
    };
    CoreLoginCredentialsPage = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* Component */])({
            selector: 'page-core-login-credentials',template:/*ion-inline-start:"E:\ionic\moodle\moodlemobile2\src\core\login\pages\credentials\credentials.html"*/'<ion-header>\n\n    <ion-navbar core-back-button>\n\n        <ion-title>{{ \'core.login.login\' | translate }}</ion-title>\n\n\n\n        <ion-buttons end>\n\n            <button *ngIf="isFixedUrlSet" ion-button icon-only [navPush]="\'CoreSettingsListPage\'" [attr.aria-label]="\'core.mainmenu.appsettings\' | translate">\n\n                <ion-icon name="cog"></ion-icon>\n\n            </button>\n\n        </ion-buttons>\n\n    </ion-navbar>\n\n</ion-header>\n\n<ion-content class="core-center-view">\n\n    <core-loading [hideUntil]="pageLoaded">\n\n        <div class="box">\n\n            <div text-wrap text-center margin-bottom>\n\n                <!-- Show site logo or a default image. -->\n\n                <img *ngIf="logoUrl" [src]="logoUrl" role="presentation">\n\n                <img *ngIf="!logoUrl" src="assets/img/login_logo.png" class="login-logo" role="presentation">\n\n                <div class="selectWrapper">\n\n                    <ion-select okText="حسنا" cancelText="إلغاء" class="siteSelect" [(ngModel)]="selectedSite" placeholder="اختر المدرسة" (ionChange)="onSiteChange($event)">\n\n                        <ion-option class="siteOptions" *ngFor="let item of urlList" value="{{item.id}}">{{item.arabic_name}}</ion-option>\n\n                    </ion-select>\n\n                </div>\n\n            </div>\n\n            <form ion-list [formGroup]="credForm" (ngSubmit)="login($event)" class="core-login-form">\n\n                <ion-item *ngIf="siteChecked && !isBrowserSSO">\n\n                    <ion-input type="text" name="username" placeholder="{{ \'core.login.username\' | translate }}" formControlName="username" autocapitalize="none" autocorrect="off"></ion-input>\n\n                </ion-item>\n\n                <ion-item *ngIf="siteChecked && !isBrowserSSO" margin-bottom>\n\n                    <core-show-password item-content [name]="\'password\'">\n\n                        <ion-input class="core-ioninput-password" name="password" type="password" placeholder="{{ \'core.login.password\' | translate }}" formControlName="password" core-show-password [clearOnEdit]="false"></ion-input>\n\n                    </core-show-password>\n\n                </ion-item>\n\n                <button *ngIf="siteChecked && !isBrowserSSO" ion-button block [disabled]="siteChecked && !isBrowserSSO && !credForm.valid">{{ \'core.login.loginbutton\' | translate }}</button>\n\n            </form>\n\n\n\n            <!-- Forgotten password button. -->\n\n            <div padding-top>\n\n                <button *ngIf="siteChecked && !isBrowserSSO" ion-button block text-wrap color="light" (click)="forgottenPassword()">{{ \'core.login.forgotten\' | translate }}</button>\n\n            </div>\n\n\n\n            <ion-list *ngIf="identityProviders && identityProviders.length" padding-top>\n\n                <ion-list-header text-wrap>{{ \'core.login.potentialidps\' | translate }}</ion-list-header>\n\n                <button ion-item *ngFor="let provider of identityProviders" text-wrap class="core-oauth-icon" (click)="oauthClicked(provider)" title="{{provider.name}}">\n\n                    <img [src]="provider.iconurl" alt="" width="32" height="32" item-start>\n\n                    {{provider.name}}\n\n                </button>\n\n            </ion-list>\n\n\n\n            <ion-list *ngIf="canSignup" padding-top>\n\n                <ion-list-header text-wrap>{{ \'core.login.firsttime\' | translate }}</ion-list-header>\n\n                <ion-item no-lines text-wrap *ngIf="authInstructions">\n\n                    <p><core-format-text [text]="authInstructions"></core-format-text></p>\n\n                </ion-item>\n\n                <button ion-button block (click)="signup()">{{ \'core.login.startsignup\' | translate }}</button>\n\n            </ion-list>\n\n        </div>\n\n    </core-loading>\n\n</ion-content>\n\n'/*ion-inline-end:"E:\ionic\moodle\moodlemobile2\src\core\login\pages\credentials\credentials.html"*/,
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["s" /* NavController */], __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["t" /* NavParams */], __WEBPACK_IMPORTED_MODULE_8__angular_forms__["a" /* FormBuilder */], __WEBPACK_IMPORTED_MODULE_3__providers_app__["a" /* CoreAppProvider */],
            __WEBPACK_IMPORTED_MODULE_5__providers_sites__["a" /* CoreSitesProvider */], __WEBPACK_IMPORTED_MODULE_7__providers_helper__["a" /* CoreLoginHelperProvider */],
            __WEBPACK_IMPORTED_MODULE_6__providers_utils_dom__["a" /* CoreDomUtilsProvider */], __WEBPACK_IMPORTED_MODULE_2__ngx_translate_core__["c" /* TranslateService */],
            __WEBPACK_IMPORTED_MODULE_4__providers_events__["a" /* CoreEventsProvider */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["q" /* ModalController */]])
    ], CoreLoginCredentialsPage);
    return CoreLoginCredentialsPage;
}());

//# sourceMappingURL=credentials.js.map

/***/ })

});
//# sourceMappingURL=36.js.map