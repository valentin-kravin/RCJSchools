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

// tslint:disable: variable-name
export class CoreConfigConstants {
    static app_id = 'com.rcj.schools';
    static appname = 'RCJSchools';
    static desktopappname = 'RCJSchools';
    static versioncode = 1000;
    static versionname = '1.0.0-dev';
    static cache_update_frequency_usually = 420000;
    static cache_update_frequency_often = 1200000;
    static cache_update_frequency_sometimes = 3600000;
    static cache_update_frequency_rarely = 43200000;
    static default_lang = 'ar';
    static languages: any = {
        'ar': 'عربي',
        'bg': 'Български',
        'ca': 'Català',
        'cs': 'Čeština',
        'da': 'Dansk',
        'de': 'Deutsch',
        'de-du': 'Deutsch - Du',
        'el': 'Ελληνικά',
        'en': 'English',
        'en-us': 'English - United States',
        'es': 'Español',
        'es-mx': 'Español - México',
        'eu': 'Euskara',
        'fa': 'فارسی',
        'fi': 'Suomi',
        'fr': 'Français',
        'he': 'עברית',
        'hi': 'हिंदी',
        'hr': 'Hrvatski',
        'hu': 'magyar',
        'id': 'Indonesian',
        'it': 'Italiano',
        'ja': '日本語',
        'km': 'ខ្មែរ',
        'kn': 'ಕನ್ನಡ',
        'ko': '한국어',
        'lt': 'Lietuvių',
        'mr': 'मराठी',
        'nl': 'Nederlands',
        'no': 'Norsk - bokmål',
        'pl': 'Polski',
        'pt': 'Português - Portugal',
        'pt-br': 'Português - Brasil',
        'ro': 'Română',
        'ru': 'Русский',
        'sr-cr': 'Српски',
        'sr-lt': 'Srpski',
        'sv': 'Svenska',
        'tg': 'Тоҷикӣ',
        'tr': 'Türkçe',
        'uk': 'Українська',
        'zh-cn': '简体中文',
        'zh-tw': '正體中文'
    };
    static wsservice = 'moodle_mobile_app';
    static wsextservice = 'local_mobile';
    static demo_sites: any = {};
    static customurlscheme = 'moodlemobile';
    static siteurl = '';
    static sitename = '';
    static multisitesdisplay = '';
    static skipssoconfirmation = false;
    static forcedefaultlanguage = false;
    static privacypolicy = 'https://moodle.org/mod/page/view.php?id=8148';
    static notificoncolor = '#f98012';
    static statusbarbg = false;
    static statusbarlighttext = false;
    static statusbarbgios = '#f98012';
    static statusbarlighttextios = true;
    static statusbarbgandroid = '#df7310';
    static statusbarlighttextandroid = true;
    static statusbarbgremotetheme = '#000000';
    static statusbarlighttextremotetheme = true;
    static enableanalytics = false;
    static compilationtime = 1563968026238;
    static lastcommit = 'fa3a2d3140aafb06a4d1129fd53e029a39bb289c';
}
