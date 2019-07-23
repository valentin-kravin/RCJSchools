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

import { Component } from '@angular/core';
import { IonicPage, NavController, ModalController, NavParams } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { CoreAppProvider } from '@providers/app';
import { CoreEventsProvider } from '@providers/events';
import { CoreSitesProvider } from '@providers/sites';
import { CoreDomUtilsProvider } from '@providers/utils/dom';
import { CoreLoginHelperProvider } from '../../providers/helper';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CoreConfigConstants } from '../../../../configconstants';

/**
 * Site url interface.
 */
export interface SiteURLItem {
    /**
     * id to identify the specific url.
     * @type {number}
     */
    id: number;

    /**
     * arabic name of the siste.
     * @type {string}
     */
    arabic_name: string;

    /**
     * arabic name of the siste.
     * @type {string}
     */
    english_name: string;

    /**
     * url of the site
     * @type {string}
     */
    url: string;
}

/**
 * Page to enter the user credentials.
 */
@IonicPage({ segment: 'core-login-credentials' })
@Component({
    selector: 'page-core-login-credentials',
    templateUrl: 'credentials.html',
})
export class CoreLoginCredentialsPage {
    credForm: FormGroup;
    siteUrl: string;
    siteChecked = false;
    siteName: string;
    logoUrl: string;
    authInstructions: string;
    canSignup: boolean;
    identityProviders: any[];
    pageLoaded = false;
    isBrowserSSO = false;
    isFixedUrlSet = false;
    urlList:Array<SiteURLItem> = [];
    selectedSite :number = -1;

    // From Core Login Page
    fixedSites: any[];
    filteredSites: any[];
    fixedDisplay = 'buttons';
    showKeyboard = false;
    filter = '';

    protected siteConfig;
    protected eventThrown = false;
    protected viewLeft = false;
    protected siteId: string;
    protected urlToOpen: string;

    constructor(private navCtrl: NavController, navParams: NavParams, fb: FormBuilder, private appProvider: CoreAppProvider,
            private sitesProvider: CoreSitesProvider, private loginHelper: CoreLoginHelperProvider,
            private domUtils: CoreDomUtilsProvider, private translate: TranslateService,
            private eventsProvider: CoreEventsProvider,
            private modalCtrl: ModalController,) {

        // this.siteUrl = navParams.get('siteUrl');
        // this.siteConfig = navParams.get('siteConfig');
        this.urlToOpen = navParams.get('urlToOpen');

        this.credForm = fb.group({
            username: [navParams.get('username') || '', Validators.required],
            password: ['', Validators.required]
        });

        // From CoreLoginSitePage
        this.showKeyboard = !!navParams.get('showKeyboard');

        let url = '';

        // Load fixed sites if they're set.
        if (this.loginHelper.hasSeveralFixedSites()) {
            this.fixedSites = <any[]> this.loginHelper.getFixedSites();
            this.fixedDisplay = CoreConfigConstants.multisitesdisplay;
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
    ionViewDidLoad(): void {
        const modal = this.domUtils.showModalLoading();
        this.sitesProvider.getSiteUrlList().then((data) => {
            data.forEach(element => {
                let oneObj: SiteURLItem =
                 {
                    id: element.id,
                    arabic_name: element.arabic_name,
                    english_name: element.english_name,
                    url: element.url
                }
                this.urlList.push(oneObj);
            });
        }, (err) => {
            this.domUtils.showErrorModal('core.login.errorgeturllist', true);
        }).finally(()=>{
            modal.dismiss();
            this.pageLoaded = true;
        });
    }

    /**
     * Change site url to connect.
     *
     * @param {Event} e The URL to connect to.
     */

    onSiteChange(e: Event): void {
        let urlToConnect = '';
        this.urlList.forEach((element) => {
            if (element.id == this.selectedSite) {
                urlToConnect = element.url;
            }
        });

        this.connect(urlToConnect);
    }

    // From CoreLoginSitePage

    /**
     * Try to connect to a site.
     *
     * @param {string} url The URL to connect to.
     */
    connect(url: string): void {
        
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

        const modal = this.domUtils.showModalLoading(),
            siteData = this.sitesProvider.getDemoSiteData(url);

        if (siteData) {
            // It's a demo site.
            this.sitesProvider.getUserToken(siteData.url, siteData.username, siteData.password).then((data) => {
                return this.sitesProvider.newSite(data.siteUrl, data.token, data.privateToken).then(() => {
                    return this.loginHelper.goToSiteInitialPage();
                }, (error) => {
                    this.domUtils.showErrorModal(error);
                });
            }, (error) => {
                this.loginHelper.treatUserTokenError(siteData.url, error, siteData.username, siteData.password);
            }).finally(() => {
                modal.dismiss();
            });

        } else {
            // Not a demo site.
            this.sitesProvider.checkSite(url).then((result) => {

                if (result.warning) {
                    this.domUtils.showErrorModal(result.warning, true, 4000);
                }

                if (this.loginHelper.isSSOLoginNeeded(result.code)) {
                    // SSO. User needs to authenticate in a browser.
                    this.loginHelper.confirmAndOpenBrowserForSSOLogin(
                        result.siteUrl, result.code, result.service, result.config && result.config.launchurl);
                } else {
                    // this.navCtrl.push('CoreLoginCredentialsPage', { siteUrl: result.siteUrl, siteConfig: result.config });
                    this.siteUrl = result.siteUrl;
                    this.siteConfig = result.config;
                    
                    this.treatSiteConfig();
                    this.isFixedUrlSet = this.loginHelper.isFixedUrlSet();

                    if (this.isFixedUrlSet) {
                        // Fixed URL, we need to check if it uses browser SSO login.
                        this.checkSite(this.siteUrl);
                    } else {
                        this.siteChecked = true;
                        this.pageLoaded = true;
                    }
                }
            }, (error) => {
                this.showLoginIssue(url, error);
            }).finally(() => {
                modal.dismiss();
            });
        }
    }

    /**
     * The filter has changed.
     *
     * @param {any} Received Event.
     */
    filterChanged(event: any): void {
        const newValue = event.target.value && event.target.value.trim().toLowerCase();
        if (!newValue || !this.fixedSites) {
            this.filteredSites = this.fixedSites;
        } else {
            this.filteredSites = this.fixedSites.filter((site) => {
                return site.name.toLowerCase().indexOf(newValue) > -1 || site.url.toLowerCase().indexOf(newValue) > -1;
            });
        }
    }

    /**
     * Show a help modal.
     */
    showHelp(): void {
        const modal = this.modalCtrl.create('CoreLoginSiteHelpPage');
        modal.present();
    }

    /**
     * Show an error that aims people to solve the issue.
     *
     * @param {string} url The URL the user was trying to connect to.
     * @param {any} error Error to display.
     */
    protected showLoginIssue(url: string, error: any): void {
        const modal = this.modalCtrl.create('CoreLoginSiteErrorPage', {
            siteUrl: url,
            issue: this.domUtils.getErrorMessage(error)
        });

        modal.present();
    }

    /**
     * View left.
     */
    ionViewDidLeave(): void {
        this.viewLeft = true;
        this.eventsProvider.trigger(CoreEventsProvider.LOGIN_SITE_UNCHECKED, { config: this.siteConfig }, this.siteId);
    }

    /**
     * Check if a site uses local_mobile, requires SSO login, etc.
     * This should be used only if a fixed URL is set, otherwise this check is already performed in CoreLoginSitePage.
     *
     * @param {string} siteUrl Site URL to check.
     * @return {Promise<any>} Promise resolved when done.
     */
    protected checkSite(siteUrl: string): Promise<any> {
        // this.pageLoaded = false;

        // If the site is configured with http:// protocol we force that one, otherwise we use default mode.
        const protocol = siteUrl.indexOf('http://') === 0 ? 'http://' : undefined;

        return this.sitesProvider.checkSite(siteUrl, protocol).then((result) => {

            this.siteChecked = true;
            this.siteUrl = result.siteUrl;

            this.siteConfig = result.config;
            this.treatSiteConfig();

            if (result && result.warning) {
                this.domUtils.showErrorModal(result.warning, true, 4000);
            }

            if (this.loginHelper.isSSOLoginNeeded(result.code)) {
                // SSO. User needs to authenticate in a browser.
                this.isBrowserSSO = true;

                // Check that there's no SSO authentication ongoing and the view hasn't changed.
                if (!this.appProvider.isSSOAuthenticationOngoing() && !this.viewLeft) {
                    this.loginHelper.confirmAndOpenBrowserForSSOLogin(
                        result.siteUrl, result.code, result.service, result.config && result.config.launchurl);
                }
            } else {
                this.isBrowserSSO = false;
            }

        }).catch((error) => {
            this.domUtils.showErrorModal(error);
        }).finally(() => {
            this.pageLoaded = true;
        });
    }

    /**
     * Treat the site configuration (if it exists).
     */
    protected treatSiteConfig(): void {
        if (this.siteConfig) {
            this.siteName = CoreConfigConstants.sitename ? CoreConfigConstants.sitename : this.siteConfig.sitename;
            this.logoUrl = this.siteConfig.logourl || this.siteConfig.compactlogourl;
            this.authInstructions = this.siteConfig.authinstructions || this.translate.instant('core.login.loginsteps');
            this.canSignup = this.siteConfig.registerauth == 'email' && !this.loginHelper.isEmailSignupDisabled(this.siteConfig);
            this.identityProviders = this.loginHelper.getValidIdentityProviders(this.siteConfig);

            if (!this.eventThrown && !this.viewLeft) {
                this.eventThrown = true;
                this.eventsProvider.trigger(CoreEventsProvider.LOGIN_SITE_CHECKED, { config: this.siteConfig });
            }
        } else {
            this.siteName = null;
            this.logoUrl = null;
            this.authInstructions = null;
            this.canSignup = false;
            this.identityProviders = [];
        }
    }

    /**
     * Tries to authenticate the user.
     *
     * @param {Event} [e] Event.
     */
    login(e?: Event): void {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        this.appProvider.closeKeyboard();

        // Get input data.
        const siteUrl = this.siteUrl,
            username = this.credForm.value.username,
            password = this.credForm.value.password;

        if (!this.siteChecked || this.isBrowserSSO) {
            // Site wasn't checked (it failed) or a previous check determined it was SSO. Let's check again.
            this.checkSite(siteUrl).then(() => {
                if (!this.isBrowserSSO) {
                    // Site doesn't use browser SSO, throw app's login again.
                    return this.login();
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

        const modal = this.domUtils.showModalLoading();

        // Start the authentication process.
        this.sitesProvider.getUserToken(siteUrl, username, password).then((data) => {
            return this.sitesProvider.newSite(data.siteUrl, data.token, data.privateToken).then((id) => {
                // Reset fields so the data is not in the view anymore.
                this.credForm.controls['username'].reset();
                this.credForm.controls['password'].reset();

                this.siteId = id;

                return this.loginHelper.goToSiteInitialPage(undefined, undefined, undefined, undefined, this.urlToOpen);
            });
        }).catch((error) => {
            this.loginHelper.treatUserTokenError(siteUrl, error, username, password);
        }).finally(() => {
            modal.dismiss();
        });
    }

    /**
     * Forgotten password button clicked.
     */
    forgottenPassword(): void {
        this.loginHelper.forgottenPasswordClicked(this.navCtrl, this.siteUrl, this.credForm.value.username, this.siteConfig);
    }

    /**
     * An OAuth button was clicked.
     *
     * @param {any} provider The provider that was clicked.
     */
    oauthClicked(provider: any): void {
        if (!this.loginHelper.openBrowserForOAuthLogin(this.siteUrl, provider, this.siteConfig.launchurl)) {
            this.domUtils.showErrorModal('Invalid data.');
        }
    }

    /**
     * Signup button was clicked.
     */
    signup(): void {
        this.navCtrl.push('CoreLoginEmailSignupPage', { siteUrl: this.siteUrl });
    }
}
