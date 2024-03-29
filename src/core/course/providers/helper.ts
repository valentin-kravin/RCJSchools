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

import { Injectable, Injector } from '@angular/core';
import { NavController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { CoreAppProvider } from '@providers/app';
import { CoreEventsProvider } from '@providers/events';
import { CoreFileProvider } from '@providers/file';
import { CoreFilepoolProvider } from '@providers/filepool';
import { CoreFileHelperProvider } from '@providers/file-helper';
import { CoreSitesProvider } from '@providers/sites';
import { CoreDomUtilsProvider } from '@providers/utils/dom';
import { CoreTextUtilsProvider } from '@providers/utils/text';
import { CoreTimeUtilsProvider } from '@providers/utils/time';
import { CoreUtilsProvider } from '@providers/utils/utils';
import { CoreCourseOptionsDelegate, CoreCourseOptionsHandlerToDisplay,
    CoreCourseOptionsMenuHandlerToDisplay } from './options-delegate';
import { CoreSiteHomeProvider } from '@core/sitehome/providers/sitehome';
import { CoreCoursesProvider } from '@core/courses/providers/courses';
import { CoreCourseProvider } from './course';
import { CoreCourseOfflineProvider } from './course-offline';
import { CoreCourseModuleDelegate } from './module-delegate';
import { CoreCourseModulePrefetchDelegate } from './module-prefetch-delegate';
import { CoreLoginHelperProvider } from '@core/login/providers/helper';
import { CoreConstants } from '@core/constants';
import { CoreSite } from '@classes/site';
import { CoreLoggerProvider } from '@providers/logger';
import * as moment from 'moment';

/**
 * Prefetch info of a module.
 */
export type CoreCourseModulePrefetchInfo = {
    /**
     * Downloaded size.
     * @type {number}
     */
    size?: number;

    /**
     * Downloadable size in a readable format.
     * @type {string}
     */
    sizeReadable?: string;

    /**
     * Module status.
     * @type {string}
     */
    status?: string;

    /**
     * Icon's name of the module status.
     * @type {string}
     */
    statusIcon?: string;

    /**
     * Time when the module was last downloaded.
     * @type {number}
     */
    downloadTime?: number;

    /**
     * Download time in a readable format.
     * @type {string}
     */
    downloadTimeReadable?: string;
};

/**
 * Progress of downloading a list of courses.
 */
export type CoreCourseCoursesProgress = {
    /**
     * Number of courses downloaded so far.
     * @type {number}
     */
    count: number;

    /**
     * Toal of courses to download.
     * @type {number}
     */
    total: number;

    /**
     * Whether the download has been successful so far.
     * @type {boolean}
     */
    success: boolean;

    /**
     * Last downloaded course.
     * @type {number}
     */
    courseId?: number;
};

/**
 * Helper to gather some common course functions.
 */
@Injectable()
export class CoreCourseHelperProvider {

    protected courseDwnPromises: { [s: string]: { [id: number]: Promise<any> } } = {};
    protected logger;

    constructor(private courseProvider: CoreCourseProvider, private domUtils: CoreDomUtilsProvider,
            private moduleDelegate: CoreCourseModuleDelegate, private prefetchDelegate: CoreCourseModulePrefetchDelegate,
            private filepoolProvider: CoreFilepoolProvider, private sitesProvider: CoreSitesProvider,
            private textUtils: CoreTextUtilsProvider, private timeUtils: CoreTimeUtilsProvider,
            private utils: CoreUtilsProvider, private translate: TranslateService, private loginHelper: CoreLoginHelperProvider,
            private courseOptionsDelegate: CoreCourseOptionsDelegate, private siteHomeProvider: CoreSiteHomeProvider,
            private eventsProvider: CoreEventsProvider, private fileHelper: CoreFileHelperProvider,
            private appProvider: CoreAppProvider, private fileProvider: CoreFileProvider, private injector: Injector,
            private coursesProvider: CoreCoursesProvider, private courseOffline: CoreCourseOfflineProvider,
            loggerProvider: CoreLoggerProvider) {

        this.logger = loggerProvider.getInstance('CoreCourseHelperProvider');
    }

    /**
     * This function treats every module on the sections provided to load the handler data, treat completion
     * and navigate to a module page if required. It also returns if sections has content.
     *
     * @param {any[]} sections List of sections to treat modules.
     * @param {number} courseId Course ID of the modules.
     * @param {any[]} [completionStatus] List of completion status.
     * @param {string} [courseName] Course name. Recommended if completionStatus is supplied.
     * @return {boolean} Whether the sections have content.
     */
    addHandlerDataForModules(sections: any[], courseId: number, completionStatus?: any, courseName?: string): boolean {
        let hasContent = false;

        sections.forEach((section) => {
            if (!section || !this.sectionHasContent(section) || !section.modules) {
                return;
            }

            hasContent = true;

            section.modules.forEach((module) => {
                module.handlerData = this.moduleDelegate.getModuleDataFor(module.modname, module, courseId, section.id);

                if (module.completiondata && module.completion > 0) {
                    module.completiondata.courseId = courseId;
                    module.completiondata.courseName = courseName;
                    module.completiondata.tracking = module.completion;
                    module.completiondata.cmid = module.id;

                    // Use of completionstatus is deprecated, use completiondata instead.
                    module.completionstatus = module.completiondata;
                } else if (completionStatus && typeof completionStatus[module.id] != 'undefined') {
                    // Should not happen on > 3.6. Check if activity has completions and if it's marked.
                    module.completiondata = completionStatus[module.id];
                    module.completiondata.courseId = courseId;
                    module.completiondata.courseName = courseName;

                    // Use of completionstatus is deprecated, use completiondata instead.
                    module.completionstatus = module.completiondata;
                }

                // Check if the module is stealth.
                module.isStealth = module.visibleoncoursepage === 0 || (module.visible && !section.visible);
            });
        });

        return hasContent;
    }

    /**
     * Calculate the status of a section.
     *
     * @param {any} section Section to calculate its status. It can't be "All sections".
     * @param {number} courseId Course ID the section belongs to.
     * @param {boolean} [refresh] True if it shouldn't use module status cache (slower).
     * @return {Promise<any>} Promise resolved when the status is calculated.
     */
    calculateSectionStatus(section: any, courseId: number, refresh?: boolean): Promise<any> {

        if (section.id == CoreCourseProvider.ALL_SECTIONS_ID) {
            return Promise.reject(null);
        }

        // Get the status of this section.
        return this.prefetchDelegate.getModulesStatus(section.modules, courseId, section.id, refresh, true).then((result) => {
            // Check if it's being downloaded.
            const downloadId = this.getSectionDownloadId(section);
            if (this.prefetchDelegate.isBeingDownloaded(downloadId)) {
                result.status = CoreConstants.DOWNLOADING;
            }

            section.downloadStatus = result.status;
            section.canCheckUpdates = this.prefetchDelegate.canCheckUpdates();
            // Set this section data.
            if (result.status !== CoreConstants.DOWNLOADING || !this.prefetchDelegate.isBeingDownloaded(section.id)) {
                section.isDownloading = false;
                section.total = 0;
            } else {
                // Section is being downloaded.
                section.isDownloading = true;
                this.prefetchDelegate.setOnProgress(downloadId, (data) => {
                    section.count = data.count;
                    section.total = data.total;
                });
            }

            return result;
        });
    }

    /**
     * Calculate the status of a list of sections, setting attributes to determine the icons/data to be shown.
     *
     * @param {any[]} sections Sections to calculate their status.
     * @param {number} courseId Course ID the sections belong to.
     * @param {boolean} [refresh] True if it shouldn't use module status cache (slower).
     * @return {Promise<void>} Promise resolved when the states are calculated.
     */
    calculateSectionsStatus(sections: any[], courseId: number, refresh?: boolean): Promise<void> {
        const promises = [];
        let allSectionsSection,
            allSectionsStatus;

        sections.forEach((section) => {
            if (section.id === CoreCourseProvider.ALL_SECTIONS_ID) {
                // "All sections" section status is calculated using the status of the rest of sections.
                allSectionsSection = section;
                section.isCalculating = true;
            } else {
                section.isCalculating = true;
                promises.push(this.calculateSectionStatus(section, courseId, refresh).then((result) => {
                    // Calculate "All sections" status.
                    allSectionsStatus = this.filepoolProvider.determinePackagesStatus(allSectionsStatus, result.status);
                }).finally(() => {
                    section.isCalculating = false;
                }));
            }
        });

        return Promise.all(promises).then(() => {
            if (allSectionsSection) {
                // Set "All sections" data.
                allSectionsSection.downloadStatus = allSectionsStatus;
                allSectionsSection.canCheckUpdates = this.prefetchDelegate.canCheckUpdates();
                allSectionsSection.isDownloading = allSectionsStatus === CoreConstants.DOWNLOADING;
            }
        }).finally(() => {
            if (allSectionsSection) {
                allSectionsSection.isCalculating = false;
            }
        });
    }

    /**
     * Show a confirm and prefetch a course. It will retrieve the sections and the course options if not provided.
     * This function will set the icon to "spinner" when starting and it will also set it back to the initial icon if the
     * user cancels. All the other updates of the icon should be made when CoreEventsProvider.COURSE_STATUS_CHANGED is received.
     *
     * @param {any} data An object where to store the course icon and title: "prefetchCourseIcon", "title" and "downloadSucceeded".
     * @param {any} course Course to prefetch.
     * @param {any[]} [sections] List of course sections.
     * @param {CoreCourseOptionsHandlerToDisplay[]} courseHandlers List of course handlers.
     * @param {CoreCourseOptionsMenuHandlerToDisplay[]} menuHandlers List of course menu handlers.
     * @return {Promise<boolean>} Promise resolved when the download finishes, rejected if an error occurs or the user cancels.
     */
    confirmAndPrefetchCourse(data: any, course: any, sections?: any[], courseHandlers?: CoreCourseOptionsHandlerToDisplay[],
            menuHandlers?: CoreCourseOptionsMenuHandlerToDisplay[]): Promise<boolean> {

        const initialIcon = data.prefetchCourseIcon,
            initialTitle = data.title,
            siteId = this.sitesProvider.getCurrentSiteId();
        let promise;

        data.downloadSucceeded = false;
        data.prefetchCourseIcon = 'spinner';
        data.title = 'core.downloading';

        // Get the sections first if needed.
        if (sections) {
            promise = Promise.resolve(sections);
        } else {
            promise = this.courseProvider.getSections(course.id, false, true);
        }

        return promise.then((sections) => {

            // Confirm the download.
            return this.confirmDownloadSizeSection(course.id, undefined, sections, true).then(() => {
                // User confirmed, get the course handlers if needed.
                const subPromises = [];
                if (!courseHandlers) {
                    subPromises.push(this.courseOptionsDelegate.getHandlersToDisplay(this.injector, course)
                        .then((cHandlers) => {
                        courseHandlers = cHandlers;
                    }));
                }
                if (!menuHandlers) {
                    subPromises.push(this.courseOptionsDelegate.getMenuHandlersToDisplay(this.injector, course)
                        .then((mHandlers) => {
                        menuHandlers = mHandlers;
                    }));
                }

                return Promise.all(subPromises).then(() => {
                    // Now we have all the data, download the course.
                    return this.prefetchCourse(course, sections, courseHandlers, menuHandlers, siteId);
                }).then(() => {
                    // Download successful.
                    data.downloadSucceeded = true;

                    return true;
                });
            }, (error): any => {
                // User cancelled or there was an error calculating the size.
                data.prefetchCourseIcon = initialIcon;
                data.title = initialTitle;

                return Promise.reject(error);
            });
        });
    }

    /**
     * Confirm and prefetches a list of courses.
     *
     * @param {any[]} courses List of courses to download.
     * @param {Function} [onProgress] Function to call everytime a course is downloaded.
     * @return {Promise<boolean>} Resolved when downloaded, rejected if error or canceled.
     */
    confirmAndPrefetchCourses(courses: any[], onProgress?: (data: CoreCourseCoursesProgress) => void): Promise<any> {
        const siteId = this.sitesProvider.getCurrentSiteId();

        // Confirm the download without checking size because it could take a while.
        return this.domUtils.showConfirm(this.translate.instant('core.areyousure')).then(() => {
            const promises = [],
                total = courses.length;
            let count = 0;

            courses.forEach((course) => {
                const subPromises = [];
                let sections,
                    handlers,
                    menuHandlers,
                    success = true;

                // Get the sections and the handlers.
                subPromises.push(this.courseProvider.getSections(course.id, false, true).then((courseSections) => {
                    sections = courseSections;
                }));
                subPromises.push(this.courseOptionsDelegate.getHandlersToDisplay(this.injector, course).then((cHandlers) => {
                    handlers = cHandlers;
                }));
                subPromises.push(this.courseOptionsDelegate.getMenuHandlersToDisplay(this.injector, course).then((mHandlers) => {
                    menuHandlers = mHandlers;
                }));

                promises.push(Promise.all(subPromises).then(() => {
                    return this.prefetchCourse(course, sections, handlers, menuHandlers, siteId);
                }).catch((error) => {
                    success = false;

                    return Promise.reject(error);
                }).finally(() => {
                    // Course downloaded or failed, notify the progress.
                    count++;
                    if (onProgress) {
                        onProgress({ count: count, total: total, courseId: course.id, success: success });
                    }
                }));
            });

            if (onProgress) {
                // Notify the start of the download.
                onProgress({ count: 0, total: total, success: true });
            }

            return this.utils.allPromises(promises);
        });
    }

    /**
     * Show confirmation dialog and then remove a module files.
     *
     * @param {any} module Module to remove the files.
     * @param {number} courseId Course ID the module belongs to.
     * @return {Promise<any>} Promise resolved when done.
     */
    confirmAndRemoveFiles(module: any, courseId: number): Promise<any> {
        return this.domUtils.showConfirm(this.translate.instant('core.course.confirmdeletemodulefiles')).then(() => {
            return this.prefetchDelegate.removeModuleFiles(module, courseId);
        }).catch((error) => {
            if (error) {
                this.domUtils.showErrorModal(error);
            }
        });
    }

    /**
     * Calculate the size to download a section and show a confirm modal if needed.
     *
     * @param {number} courseId Course ID the section belongs to.
     * @param {any} [section] Section. If not provided, all sections.
     * @param {any[]} [sections] List of sections. Used when downloading all the sections.
     * @param {boolean} [alwaysConfirm] True to show a confirm even if the size isn't high, false otherwise.
     * @return {Promise<any>} Promise resolved if the user confirms or there's no need to confirm.
     */
    confirmDownloadSizeSection(courseId: number, section?: any, sections?: any[], alwaysConfirm?: boolean): Promise<any> {
        let sizePromise,
            haveEmbeddedFiles = false;

        // Calculate the size of the download.
        if (section && section.id != CoreCourseProvider.ALL_SECTIONS_ID) {
            sizePromise = this.prefetchDelegate.getDownloadSize(section.modules, courseId);

            // Check if the section has embedded files in the description.
            haveEmbeddedFiles = this.domUtils.extractDownloadableFilesFromHtml(section.summary).length > 0;
        } else {
            const promises = [],
                results = {
                    size: 0,
                    total: true
                };

            sections.forEach((s) => {
                if (s.id != CoreCourseProvider.ALL_SECTIONS_ID) {
                    promises.push(this.prefetchDelegate.getDownloadSize(s.modules, courseId).then((sectionSize) => {
                        results.total = results.total && sectionSize.total;
                        results.size += sectionSize.size;
                    }));

                    // Check if the section has embedded files in the description.
                    if (!haveEmbeddedFiles && this.domUtils.extractDownloadableFilesFromHtml(s.summary).length > 0) {
                        haveEmbeddedFiles = true;
                    }
                }
            });

            sizePromise = Promise.all(promises).then(() => {
                return results;
            });
        }

        return sizePromise.then((size) => {
            if (haveEmbeddedFiles) {
                size.total = false;
            }

            // Show confirm modal if needed.
            return this.domUtils.confirmDownloadSize(size, undefined, undefined, undefined, undefined, alwaysConfirm);
        });
    }

    /**
     * Helper function to prefetch a module, showing a confirmation modal if the size is big.
     * This function is meant to be called from a context menu option. It will also modify some data like the prefetch icon.
     *
     * @param {any} instance The component instance that has the context menu. It should have prefetchStatusIcon and isDestroyed.
     * @param {any} module Module to be prefetched
     * @param {number} courseId Course ID the module belongs to.
     * @param {Function} [done] Function to call when done. It will close the context menu.
     * @return {Promise<any>} Promise resolved when done.
     */
    contextMenuPrefetch(instance: any, module: any, courseId: number, done?: () => void): Promise<any> {
        const initialIcon = instance.prefetchStatusIcon;

        instance.prefetchStatusIcon = 'spinner'; // Show spinner since this operation might take a while.

        // We need to call getDownloadSize, the package might have been updated.
        return this.prefetchDelegate.getModuleDownloadSize(module, courseId, true).then((size) => {
            return this.domUtils.confirmDownloadSize(size).then(() => {
                return this.prefetchDelegate.prefetchModule(module, courseId, true);
            });
        }).then(() => {
            // Success, close menu.
            done && done();
        }).catch((error) => {
            instance.prefetchStatusIcon = initialIcon;

            if (!instance.isDestroyed) {
                this.domUtils.showErrorModalDefault(error, 'core.errordownloading', true);
            }
        });
    }

    /**
     * Determine the status of a list of courses.
     *
     * @param {any[]} courses Courses
     * @return {Promise<string>} Promise resolved with the status.
     */
    determineCoursesStatus(courses: any[]): Promise<string> {
        // Get the status of each course.
        const promises = [],
            siteId = this.sitesProvider.getCurrentSiteId();

        courses.forEach((course) => {
            promises.push(this.courseProvider.getCourseStatus(course.id, siteId));
        });

        return Promise.all(promises).then((statuses) => {
            // Now determine the status of the whole list.
            let status = statuses[0];
            for (let i = 1; i < statuses.length; i++) {
                status = this.filepoolProvider.determinePackagesStatus(status, statuses[i]);
            }

            return status;
        });
    }

    /**
     * Convenience function to open a module main file, downloading the package if needed.
     * This is meant for modules like mod_resource.
     *
     * @param {any} module The module to download.
     * @param {number} courseId The course ID of the module.
     * @param {string} [component] The component to link the files to.
     * @param {string|number} [componentId] An ID to use in conjunction with the component.
     * @param {any[]} [files] List of files of the module. If not provided, use module.contents.
     * @param {string} [siteId] The site ID. If not defined, current site.
     * @return {Promise<any>} Resolved on success.
     */
    downloadModuleAndOpenFile(module: any, courseId: number, component?: string, componentId?: string | number, files?: any[],
            siteId?: string): Promise<any> {
        siteId = siteId || this.sitesProvider.getCurrentSiteId();

        let promise;
        if (files) {
            promise = Promise.resolve(files);
        } else {
            promise = this.courseProvider.loadModuleContents(module, courseId).then(() => {
                files = module.contents;
            });
        }

        // Make sure that module contents are loaded.
        return promise.then(() => {
            if (!files || !files.length) {
                return Promise.reject(this.utils.createFakeWSError('core.filenotfound', true));
            }

            return this.sitesProvider.getSite(siteId);
        }).then((site) => {
            const mainFile = files[0],
                fileUrl = this.fileHelper.getFileUrl(mainFile);

            // Check if the file should be opened in browser.
            if (this.fileHelper.shouldOpenInBrowser(mainFile)) {
                if (this.appProvider.isOnline()) {
                    // Open in browser.
                    let fixedUrl = site.fixPluginfileURL(fileUrl).replace('&offline=1', '');
                    // Remove forcedownload when followed by another param.
                    fixedUrl = fixedUrl.replace(/forcedownload=\d+&/, '');
                    // Remove forcedownload when not followed by any param.
                    fixedUrl = fixedUrl.replace(/[\?|\&]forcedownload=\d+/, '');

                    this.utils.openInBrowser(fixedUrl);

                    if (this.fileProvider.isAvailable()) {
                        // Download the file if needed (file outdated or not downloaded).
                        // Download will be in background, don't return the promise.
                        this.downloadModule(module, courseId, component, componentId, files, siteId);
                    }

                    return;
                } else {
                    // Not online, get the offline file. It will fail if not found.
                    return this.filepoolProvider.getInternalUrlByUrl(siteId, fileUrl).then((path) => {
                        return this.utils.openFile(path);
                    }).catch((error) => {
                        return Promise.reject(this.translate.instant('core.networkerrormsg'));
                    });
                }
            }

            // File shouldn't be opened in browser. Download the module if it needs to be downloaded.
            return this.downloadModuleWithMainFileIfNeeded(module, courseId, component, componentId, files, siteId)
                    .then((result) => {
                if (result.path.indexOf('http') === 0) {
                    /* In iOS, if we use the same URL in embedded browser and background download then the download only
                       downloads a few bytes (cached ones). Add a hash to the URL so both URLs are different. */
                    result.path = result.path + '#moodlemobile-embedded';

                    return this.utils.openOnlineFile(result.path).catch((error) => {
                        // Error opening the file, some apps don't allow opening online files.
                        if (!this.fileProvider.isAvailable()) {
                            return Promise.reject(error);
                        } else if (result.status === CoreConstants.DOWNLOADING) {
                            return Promise.reject(this.translate.instant('core.erroropenfiledownloading'));
                        }

                        let promise;
                        if (result.status === CoreConstants.NOT_DOWNLOADED) {
                            // Not downloaded, download it now and return the local file.
                            promise = this.downloadModule(module, courseId, component, componentId, files, siteId).then(() => {
                                return this.filepoolProvider.getInternalUrlByUrl(siteId, fileUrl);
                            });
                        } else {
                            // File is outdated or stale and can't be opened in online, return the local URL.
                            promise = this.filepoolProvider.getInternalUrlByUrl(siteId, fileUrl);
                        }

                        return promise.then((path) => {
                            return this.utils.openFile(path);
                        });
                    });
                } else {
                    return this.utils.openFile(result.path);
                }
            });
        });
    }

    /**
     * Convenience function to download a module that has a main file and return the local file's path and other info.
     * This is meant for modules like mod_resource.
     *
     * @param {any} module The module to download.
     * @param {number} courseId The course ID of the module.
     * @param {string} [component] The component to link the files to.
     * @param {string|number} [componentId] An ID to use in conjunction with the component.
     * @param {any[]} [files] List of files of the module. If not provided, use module.contents.
     * @param {string} [siteId] The site ID. If not defined, current site.
     * @return {Promise<{fixedUrl: string, path: string, status: string}>} Promise resolved when done.
     */
    downloadModuleWithMainFileIfNeeded(module: any, courseId: number, component?: string, componentId?: string | number,
            files?: any[], siteId?: string): Promise<{fixedUrl: string, path: string, status: string}> {

        siteId = siteId || this.sitesProvider.getCurrentSiteId();

        if (!files || !files.length) {
            // Module not valid, stop.
            return Promise.reject(null);
        }

        const mainFile = files[0],
            fileUrl = this.fileHelper.getFileUrl(mainFile),
            timemodified = this.fileHelper.getFileTimemodified(mainFile),
            result = {
                fixedUrl: undefined,
                path: undefined,
                status: undefined
            };

        return this.sitesProvider.getSite(siteId).then((site) => {
            const fixedUrl = site.fixPluginfileURL(fileUrl);
            result.fixedUrl = fixedUrl;

            if (this.fileProvider.isAvailable()) {
                // The file system is available.
                return this.filepoolProvider.getPackageStatus(siteId, component, componentId).then((status) => {
                    result.status = status;

                    const isWifi = this.appProvider.isWifi(),
                        isOnline = this.appProvider.isOnline();

                    if (status === CoreConstants.DOWNLOADED) {
                        // Get the local file URL.
                        return this.filepoolProvider.getInternalUrlByUrl(siteId, fileUrl).catch((error) => {
                            // File not found, mark the module as not downloaded and reject.
                            return this.filepoolProvider.storePackageStatus(siteId, CoreConstants.NOT_DOWNLOADED, component,
                                    componentId).then(() => {

                                return Promise.reject(error);
                            });
                        });
                    } else if (status === CoreConstants.DOWNLOADING && !this.appProvider.isDesktop()) {
                        // Return the online URL.
                        return fixedUrl;
                    } else {
                        if (!isOnline && status === CoreConstants.NOT_DOWNLOADED) {
                            // Not downloaded and we're offline, reject.
                            return Promise.reject(this.translate.instant('core.networkerrormsg'));
                        }

                        return this.filepoolProvider.shouldDownloadBeforeOpen(fixedUrl, mainFile.filesize).then(() => {
                            // Download and then return the local URL.
                            return this.downloadModule(module, courseId, component, componentId, files, siteId).then(() => {
                                return this.filepoolProvider.getInternalUrlByUrl(siteId, fileUrl);
                            });
                        }, () => {
                            // Start the download if in wifi, but return the URL right away so the file is opened.
                            if (isWifi) {
                                this.downloadModule(module, courseId, component, componentId, files, siteId);
                            }

                            if (!this.fileHelper.isStateDownloaded(status) || isOnline) {
                                // Not downloaded or online, return the online URL.
                                return fixedUrl;
                            } else {
                                // Outdated but offline, so we return the local URL. Use getUrlByUrl so it's added to the queue.
                                return this.filepoolProvider.getUrlByUrl(siteId, fileUrl, component, componentId, timemodified,
                                        false, false, mainFile);
                            }
                        });
                    }
                }).then((path) => {
                    result.path = path;

                    return result;
                });
            } else {
                // We use the live URL.
                result.path = fixedUrl;

                return result;
            }
        });
    }

    /**
     * Convenience function to download a module.
     *
     * @param {any} module The module to download.
     * @param {number} courseId The course ID of the module.
     * @param {string} [component] The component to link the files to.
     * @param {string|number} [componentId] An ID to use in conjunction with the component.
     * @param {any[]} [files] List of files of the module. If not provided, use module.contents.
     * @param {string} [siteId] The site ID. If not defined, current site.
     * @return {Promise<any>} Promise resolved when done.
     */
    downloadModule(module: any, courseId: number, component?: string, componentId?: string | number, files?: any[], siteId?: string)
            : Promise<any> {

        const prefetchHandler = this.prefetchDelegate.getPrefetchHandlerFor(module);

        if (prefetchHandler) {
            // Use the prefetch handler to download the module.
            if (prefetchHandler.download) {
                return prefetchHandler.download(module, courseId);
            } else {
                return prefetchHandler.prefetch(module, courseId, true);
            }
        }

        // There's no prefetch handler for the module, just download the files.
        files = files || module.contents;

        return this.filepoolProvider.downloadOrPrefetchFiles(siteId, files, false, false, component, componentId);
    }

    /**
     * Fill the Context Menu for a certain module.
     *
     * @param {any} instance The component instance that has the context menu.
     * @param {any} module Module to be prefetched
     * @param {number} courseId Course ID the module belongs to.
     * @param {boolean} [invalidateCache] Invalidates the cache first.
     * @param {string} [component] Component of the module.
     * @return {Promise<any>} Promise resolved when done.
     */
    fillContextMenu(instance: any, module: any, courseId: number, invalidateCache?: boolean, component?: string): Promise<any> {
        return this.getModulePrefetchInfo(module, courseId, invalidateCache, component).then((moduleInfo) => {
            instance.size = moduleInfo.size > 0 ? moduleInfo.sizeReadable : 0;
            instance.prefetchStatusIcon = moduleInfo.statusIcon;
            instance.prefetchStatus = moduleInfo.status;

            if (moduleInfo.status != CoreConstants.NOT_DOWNLOADABLE) {
                // Module is downloadable, get the text to display to prefetch.
                if (moduleInfo.downloadTime > 0) {
                    instance.prefetchText = this.translate.instant('core.lastdownloaded') + ': ' + moduleInfo.downloadTimeReadable;
                } else {
                    // Module not downloaded, show a default text.
                    instance.prefetchText = this.translate.instant('core.download');
                }
            }

            if (typeof instance.contextMenuStatusObserver == 'undefined' && component) {
                instance.contextMenuStatusObserver = this.eventsProvider.on(CoreEventsProvider.PACKAGE_STATUS_CHANGED, (data) => {
                    if (data.componentId == module.id && data.component == component) {
                        this.fillContextMenu(instance, module, courseId, false, component);
                    }
                }, this.sitesProvider.getCurrentSiteId());
            }
        });
    }

    /**
     * Get a course. It will first check the user courses, and fallback to another WS if not enrolled.
     *
     * @param {number} courseId Course ID.
     * @param {string} [siteId] Site ID. If not defined, current site.
     * @return {Promise<{enrolled: boolean, course: any}>} Promise resolved with the course.
     */
    getCourse(courseId: number, siteId?: string): Promise<{enrolled: boolean, course: any}> {
        siteId = siteId || this.sitesProvider.getCurrentSiteId();

        // Try with enrolled courses first.
        return this.coursesProvider.getUserCourse(courseId, false, siteId).then((course) => {
            return { enrolled: true, course: course };
        }).catch(() => {
            // Not enrolled or an error happened. Try to use another WebService.
            return this.coursesProvider.isGetCoursesByFieldAvailableInSite(siteId).then((available) => {
                if (available) {
                    return this.coursesProvider.getCourseByField('id', courseId, siteId);
                } else {
                    return this.coursesProvider.getCourse(courseId, siteId);
                }
            }).then((course) => {
                return { enrolled: false, course: course };
            });
        });
    }

    /**
     * Get a course, wait for any course format plugin to load, and open the course page. It basically chains the functions
     * getCourse and openCourse.
     *
     * @param {NavController} navCtrl The nav controller to use. If not defined, the course will be opened in main menu.
     * @param {number} courseId Course ID.
     * @param {any} [params] Other params to pass to the course page.
     * @param {string} [siteId] Site ID. If not defined, current site.
     */
    getAndOpenCourse(navCtrl: NavController, courseId: number, params?: any, siteId?: string): Promise<any> {
        const modal = this.domUtils.showModalLoading();

        return this.getCourse(courseId, siteId).then((data) => {
            return data.course;
        }).catch(() => {
            // Cannot get course, return a "fake".
            return { id: courseId };
        }).then((course) => {
            modal.dismiss();

            return this.openCourse(navCtrl, course, params, siteId);
        });
    }

    /**
     * Check if the course has a block with that name.
     *
     * @param {number} courseId Course ID.
     * @param {string} name     Block name to search.
     * @param {string} [siteId] Site ID. If not defined, current site.
     * @return {Promise<boolean>} Promise resolved with true if the block exists or false otherwise.
     * @since 3.3
     */
    hasABlockNamed(courseId: number, name: string, siteId?: string): Promise<boolean> {
        return this.courseProvider.getCourseBlocks(courseId, siteId).then((blocks) => {
            return blocks.some((block) => {
                return block.name == name;
            });
        }).catch(() => {
            return false;
        });
    }

    /**
     * Initialize the prefetch icon for selected courses.
     *
     * @param  {any[]}        courses  Courses array to get info from.
     * @param  {any}          prefetch Prefetch information.
     * @param  {number}       [minCourses=2] Min course to show icon.
     * @return {Promise<any>}          Resolved with the prefetch information updated when done.
     */
    initPrefetchCoursesIcons(courses: any[], prefetch: any, minCourses: number = 2): Promise<any> {
        if (!courses || courses.length < minCourses) {
            // Not enough courses.
            prefetch.icon = '';

            return Promise.resolve(prefetch);
        }

        return this.determineCoursesStatus(courses).then((status) => {
            let icon = this.getCourseStatusIconAndTitleFromStatus(status).icon;
            if (icon == 'spinner') {
                // It seems all courses are being downloaded, show a download button instead.
                icon = 'cloud-download';
            }
            prefetch.icon = icon;

            return prefetch;
        });
    }

    /**
     * Load offline completion into a list of sections.
     * This should be used in 3.6 sites or higher, where the course contents already include the completion.
     *
     * @param {number} courseId The course to get the completion.
     * @param {any[]} sections List of sections of the course.
     * @param {string} [siteId] Site ID. If not defined, current site.
     * @return {Promise<any>} Promise resolved when done.
     */
    loadOfflineCompletion(courseId: number, sections: any[], siteId?: string): Promise<any> {
        return this.courseOffline.getCourseManualCompletions(courseId, siteId).then((offlineCompletions) => {
            if (!offlineCompletions || !offlineCompletions.length) {
                // No offline completion.
                return;
            }

            const totalOffline = offlineCompletions.length;
            let loaded = 0;

            offlineCompletions = this.utils.arrayToObject(offlineCompletions, 'cmid');

            // Load the offline data in the modules.
            for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                if (!section.modules || !section.modules.length) {
                    // Section has no modules, ignore it.
                    continue;
                }

                for (let j = 0; j < section.modules.length; j++) {
                    const module = section.modules[j],
                        offlineCompletion = offlineCompletions[module.id];

                    if (offlineCompletion && typeof module.completiondata != 'undefined' &&
                            offlineCompletion.timecompleted >= module.completiondata.timecompleted * 1000) {
                        // The module has offline completion. Load it.
                        module.completiondata.state = offlineCompletion.completed;
                        module.completiondata.offline = true;

                        // If all completions have been loaded, stop.
                        loaded++;
                        if (loaded == totalOffline) {
                            break;
                        }
                    }
                }
            }
        });
    }

    /**
     * Prefetch all the courses in the array.
     *
     * @param  {any[]}        courses  Courses array to prefetch.
     * @param  {any}          prefetch Prefetch information to be updated.
     * @return {Promise<any>} Promise resolved when done.
     */
    prefetchCourses(courses: any[], prefetch: any): Promise<any> {
        prefetch.icon = 'spinner';
        prefetch.badge = '';

        return this.confirmAndPrefetchCourses(courses, (progress) => {
            prefetch.badge = progress.count + ' / ' + progress.total;
        }).then(() => {
            prefetch.icon = 'refresh';
        }).finally(() => {
            prefetch.badge = '';
        });
    }

    /**
     * Get a course download promise (if any).
     *
     * @param {number} courseId Course ID.
     * @param {string} [siteId] Site ID. If not defined, current site.
     * @return {Promise<any>} Download promise, undefined if not found.
     */
    getCourseDownloadPromise(courseId: number, siteId?: string): Promise<any> {
        siteId = siteId || this.sitesProvider.getCurrentSiteId();

        return this.courseDwnPromises[siteId] && this.courseDwnPromises[siteId][courseId];
    }

    /**
     * Get a course status icon and the langkey to use as a title.
     *
     * @param {number} courseId Course ID.
     * @param {string} [siteId] Site ID. If not defined, current site.
     * @return {Promise<{icon: string, title: string}>} Promise resolved with the icon name and the title key.
     */
    getCourseStatusIconAndTitle(courseId: number, siteId?: string): Promise<{icon: string, title: string}> {
        return this.courseProvider.getCourseStatus(courseId, siteId).then((status) => {
            return this.getCourseStatusIconAndTitleFromStatus(status);
        });
    }

    /**
     * Get a course status icon and the langkey to use as a title from status.
     *
     * @param {string} status Course status.
     * @return {{icon: string, title: string}} Title and icon name.
     */
    getCourseStatusIconAndTitleFromStatus(status: string): {icon: string, title: string} {
        if (status == CoreConstants.DOWNLOADED) {
            // Always show refresh icon, we cannot know if there's anything new in course options.
            return {
                icon: 'refresh',
                title: 'core.course.refreshcourse'
            };
        } else if (status == CoreConstants.DOWNLOADING) {
            return {
                icon: 'spinner',
                title: 'core.downloading'
            };
        } else {
            return {
                icon: 'cloud-download',
                title: 'core.course.downloadcourse'
            };
        }
    }

    /**
     * Get the course ID from a module instance ID, showing an error message if it can't be retrieved.
     *
     * @param {number} id Instance ID.
     * @param {string} module Name of the module. E.g. 'glossary'.
     * @param {string} [siteId] Site ID. If not defined, current site.
     * @return {Promise<number>} Promise resolved with the module's course ID.
     */
    getModuleCourseIdByInstance(id: number, module: any, siteId?: string): Promise<number> {
        return this.courseProvider.getModuleBasicInfoByInstance(id, module, siteId).then((cm) => {
            return cm.course;
        }).catch((error) => {
            this.domUtils.showErrorModalDefault(error, 'core.course.errorgetmodule', true);

            return Promise.reject(null);
        });
    }

    /**
     * Get prefetch info for a module.
     *
     * @param {any} module Module to get the info from.
     * @param {number} courseId Course ID the section belongs to.
     * @param {boolean} [invalidateCache] Invalidates the cache first.
     * @param {string} [component] Component of the module.
     * @return {Promise<CoreCourseModulePrefetchInfo>} Promise resolved with the info.
     */
    getModulePrefetchInfo(module: any, courseId: number, invalidateCache?: boolean, component?: string)
            : Promise<CoreCourseModulePrefetchInfo> {
        const moduleInfo: CoreCourseModulePrefetchInfo = {},
            siteId = this.sitesProvider.getCurrentSiteId(),
            promises = [];

        if (invalidateCache) {
            this.prefetchDelegate.invalidateModuleStatusCache(module);
        }

        promises.push(this.prefetchDelegate.getModuleDownloadedSize(module, courseId).then((moduleSize) => {
            moduleInfo.size = moduleSize;
            moduleInfo.sizeReadable = this.textUtils.bytesToSize(moduleSize, 2);
        }));

        promises.push(this.prefetchDelegate.getModuleStatus(module, courseId).then((moduleStatus) => {
            moduleInfo.status = moduleStatus;
            switch (moduleStatus) {
                case CoreConstants.NOT_DOWNLOADED:
                    moduleInfo.statusIcon = 'cloud-download';
                    break;
                case CoreConstants.DOWNLOADING:
                    moduleInfo.statusIcon = 'spinner';
                    break;
                case CoreConstants.OUTDATED:
                    moduleInfo.statusIcon = 'refresh';
                    break;
                case CoreConstants.DOWNLOADED:
                    if (!this.prefetchDelegate.canCheckUpdates()) {
                        moduleInfo.statusIcon = 'refresh';
                        break;
                    }
                default:
                    moduleInfo.statusIcon = '';
                    break;
            }
        }));

        // Get the time it was downloaded (if it was downloaded).
        promises.push(this.filepoolProvider.getPackageData(siteId, component, module.id).then((data) => {
            if (data && data.downloadTime && (data.status == CoreConstants.OUTDATED || data.status == CoreConstants.DOWNLOADED)) {
                const now = this.timeUtils.timestamp();
                moduleInfo.downloadTime = data.downloadTime;
                if (now - data.downloadTime < 7 * 86400) {
                    moduleInfo.downloadTimeReadable = moment(data.downloadTime * 1000).fromNow();
                } else {
                    moduleInfo.downloadTimeReadable = moment(data.downloadTime * 1000).calendar();
                }
            }
        }).catch(() => {
            // Not downloaded.
            moduleInfo.downloadTime = 0;
        }));

        return Promise.all(promises).then(() => {
            return moduleInfo;
        });
    }

    /**
     * Get the download ID of a section. It's used to interact with CoreCourseModulePrefetchDelegate.
     *
     * @param {any} section Section.
     * @return {string} Section download ID.
     */
    getSectionDownloadId(section: any): string {
        return 'Section-' + section.id;
    }

    /**
     * Navigate to a module.
     *
     * @param {number} moduleId Module's ID.
     * @param {string} [siteId] Site ID. If not defined, current site.
     * @param {number} [courseId] Course ID. If not defined we'll try to retrieve it from the site.
     * @param {number} [sectionId] Section the module belongs to. If not defined we'll try to retrieve it from the site.
     * @param {string} [modName] If set, the app will retrieve all modules of this type with a single WS call. This reduces the
     *                           number of WS calls, but it isn't recommended for modules that can return a lot of contents.
     * @param {any} [modParams] Params to pass to the module
     * @param {NavController} [navCtrl] NavController for adding new pages to the current history. Optional for legacy support, but
     *                                  generates a warning if omitted.
     * @return {Promise<void>} Promise resolved when done.
     */
    navigateToModule(moduleId: number, siteId?: string, courseId?: number, sectionId?: number, modName?: string, modParams?: any,
                     navCtrl?: NavController)
            : Promise<void> {
        siteId = siteId || this.sitesProvider.getCurrentSiteId();

        const modal = this.domUtils.showModalLoading();
        let promise,
            site: CoreSite;

        if (courseId && sectionId) {
            // No need to retrieve more data.
            promise = Promise.resolve();
        } else if (!courseId) {
            // We don't have courseId.
            promise = this.courseProvider.getModuleBasicInfo(moduleId, siteId).then((module) => {
                courseId = module.course;
                sectionId = module.section;
            });
        } else {
            // We don't have sectionId but we have courseId.
            promise = this.courseProvider.getModuleSectionId(moduleId, siteId).then((id) => {
                sectionId = id;
            });
        }

        return promise.then(() => {
            // Make sure they're numbers.
            courseId = Number(courseId);
            sectionId = Number(sectionId);

            // Get the site.
            return this.sitesProvider.getSite(siteId);
        }).then((s) => {
            site = s;

            // Get the module.
            return this.courseProvider.getModule(moduleId, courseId, sectionId, false, false, siteId, modName);
        }).then((module) => {
            const params = {
                course: { id: courseId },
                module: module,
                sectionId: sectionId,
                modParams: modParams
            };

            module.handlerData = this.moduleDelegate.getModuleDataFor(module.modname, module, courseId, sectionId);

            if (navCtrl) {
                // If the link handler for this module passed through navCtrl, we can use the module's handler to navigate cleanly.
                // Otherwise, we will redirect below.
                modal.dismiss();

                return module.handlerData.action(new Event('click'), navCtrl, module, courseId);
            }

            this.logger.warn('navCtrl was not passed to navigateToModule by the link handler for ' + module.modname);

            if (courseId == site.getSiteHomeId()) {
                // Check if site home is available.
                return this.siteHomeProvider.isAvailable().then(() => {
                    this.loginHelper.redirect('CoreSiteHomeIndexPage', params, siteId);
                }).finally(() => {
                    modal.dismiss();
                });
            } else {
                modal.dismiss();

                return this.getAndOpenCourse(undefined, courseId, params, siteId);
            }
        }).catch((error) => {
            modal.dismiss();
            this.domUtils.showErrorModalDefault(error, 'core.course.errorgetmodule', true);
        });
    }

    /**
     * Open a module.
     *
     * @param {NavController} navCtrl The NavController to use.
     * @param {any} module The module to open.
     * @param {number} courseId The course ID of the module.
     * @param {number} [sectionId] The section ID of the module.
     * @param {any} [modParams] Params to pass to the module
     * @param {boolean} True if module can be opened, false otherwise.
     */
    openModule(navCtrl: NavController, module: any, courseId: number, sectionId?: number, modParams?: any): boolean {
        if (!module.handlerData) {
            module.handlerData = this.moduleDelegate.getModuleDataFor(module.modname, module, courseId, sectionId);
        }

        if (module.handlerData && module.handlerData.action) {
            module.handlerData.action(new Event('click'), navCtrl, module, courseId, { animate: false }, modParams);

            return true;
        }

        return false;
    }

    /**
     * Prefetch all the activities in a course and also the course addons.
     *
     * @param {any} course The course to prefetch.
     * @param {any[]} sections List of course sections.
     * @param {CoreCourseOptionsHandlerToDisplay[]} courseHandlers List of course options handlers.
     * @param {CoreCourseOptionsMenuHandlerToDisplay[]} courseMenuHandlers List of course menu handlers.
     * @param {string} [siteId] Site ID. If not defined, current site.
     * @return {Promise}                Promise resolved when the download finishes.
     */
    prefetchCourse(course: any, sections: any[], courseHandlers: CoreCourseOptionsHandlerToDisplay[],
           courseMenuHandlers: CoreCourseOptionsMenuHandlerToDisplay[], siteId?: string): Promise<any> {
        siteId = siteId || this.sitesProvider.getCurrentSiteId();

        if (this.courseDwnPromises[siteId] && this.courseDwnPromises[siteId][course.id]) {
            // There's already a download ongoing for this course, return the promise.
            return this.courseDwnPromises[siteId][course.id];
        } else if (!this.courseDwnPromises[siteId]) {
            this.courseDwnPromises[siteId] = {};
        }

        // First of all, mark the course as being downloaded.
        this.courseDwnPromises[siteId][course.id] = this.courseProvider.setCourseStatus(course.id, CoreConstants.DOWNLOADING,
                siteId).then(() => {

            const promises = [];
            let allSectionsSection = sections[0];

            // Prefetch all the sections. If the first section is "All sections", use it. Otherwise, use a fake "All sections".
            if (sections[0].id != CoreCourseProvider.ALL_SECTIONS_ID) {
                allSectionsSection = { id: CoreCourseProvider.ALL_SECTIONS_ID };
            }
            promises.push(this.prefetchSection(allSectionsSection, course.id, sections));

            // Prefetch course options.
            courseHandlers.forEach((handler) => {
                if (handler.prefetch) {
                    promises.push(handler.prefetch(course));
                }
            });
            courseMenuHandlers.forEach((handler) => {
                if (handler.prefetch) {
                    promises.push(handler.prefetch(course));
                }
            });

            // Prefetch other data needed to render the course.
            if (this.coursesProvider.isGetCoursesByFieldAvailable()) {
                promises.push(this.coursesProvider.getCoursesByField('id', course.id));
            }

            const sectionWithModules = sections.find((section) => {
                    return section.modules && section.modules.length > 0;
            });
            if (!sectionWithModules || typeof sectionWithModules.modules[0].completion == 'undefined') {
                promises.push(this.courseProvider.getActivitiesCompletionStatus(course.id));
            }

            return this.utils.allPromises(promises);
        }).then(() => {
            // Download success, mark the course as downloaded.
            return this.courseProvider.setCourseStatus(course.id, CoreConstants.DOWNLOADED, siteId);
        }).catch((error) => {
            // Error, restore previous status.
            return this.courseProvider.setCoursePreviousStatus(course.id, siteId).then(() => {
                return Promise.reject(error);
            });
        }).finally(() => {
            delete this.courseDwnPromises[siteId][course.id];
        });

        return this.courseDwnPromises[siteId][course.id];
    }

    /**
     * Helper function to prefetch a module, showing a confirmation modal if the size is big
     * and invalidating contents if refreshing.
     *
     * @param {handler} handler Prefetch handler to use. Must implement 'prefetch' and 'invalidateContent'.
     * @param {any} module Module to download.
     * @param {any} size Object containing size to download (in bytes) and a boolean to indicate if its totally calculated.
     * @param {number} courseId Course ID of the module.
     * @param {boolean} [refresh] True if refreshing, false otherwise.
     * @return {Promise<any>} Promise resolved when downloaded.
     */
    prefetchModule(handler: any, module: any, size: any, courseId: number, refresh?: boolean): Promise<any> {
        // Show confirmation if needed.
        return this.domUtils.confirmDownloadSize(size).then(() => {
            // Invalidate content if refreshing and download the data.
            const promise = refresh ? handler.invalidateContent(module.id, courseId) : Promise.resolve();

            return promise.catch(() => {
                // Ignore errors.
            }).then(() => {
                return this.prefetchDelegate.prefetchModule(module, courseId, true);
            });
        });
    }

    /**
     * Prefetch one section or all the sections.
     * If the section is "All sections" it will prefetch all the sections.
     *
     * @param {any} section Section.
     * @param {number} courseId Course ID the section belongs to.
     * @param {any[]} [sections] List of sections. Used when downloading all the sections.
     * @return {Promise<any>} Promise resolved when the prefetch is finished.
     */
    prefetchSection(section: any, courseId: number, sections?: any[]): Promise<any> {
        if (section.id != CoreCourseProvider.ALL_SECTIONS_ID) {
            // Download only this section.
            return this.prefetchSingleSectionIfNeeded(section, courseId).finally(() => {
                // Calculate the status of the section that finished.
                return this.calculateSectionStatus(section, courseId);
            });
        } else {
            // Download all the sections except "All sections".
            const promises = [];
            let allSectionsStatus;

            section.isDownloading = true;
            sections.forEach((section) => {
                if (section.id != CoreCourseProvider.ALL_SECTIONS_ID) {
                    promises.push(this.prefetchSingleSectionIfNeeded(section, courseId).finally(() => {
                        // Calculate the status of the section that finished.
                        return this.calculateSectionStatus(section, courseId).then((result) => {
                            // Calculate "All sections" status.
                            allSectionsStatus = this.filepoolProvider.determinePackagesStatus(allSectionsStatus, result.status);
                        });
                    }));
                }
            });

            return this.utils.allPromises(promises).then(() => {
                // Set "All sections" data.
                section.downloadStatus = allSectionsStatus;
                section.canCheckUpdates = this.prefetchDelegate.canCheckUpdates();
                section.isDownloading = allSectionsStatus === CoreConstants.DOWNLOADING;
            }).finally(() => {
                section.isDownloading = false;
            });
        }
    }

    /**
     * Prefetch a certain section if it needs to be prefetched.
     * If the section is "All sections" it will be ignored.
     *
     * @param {any} section Section to prefetch.
     * @param {number} courseId Course ID the section belongs to.
     * @return {Promise<any>} Promise resolved when the section is prefetched.
     */
    protected prefetchSingleSectionIfNeeded(section: any, courseId: number): Promise<any> {
        if (section.id == CoreCourseProvider.ALL_SECTIONS_ID) {
            return Promise.resolve();
        }

        if (section.hiddenbynumsections) {
            // Hidden section.
            return Promise.resolve();
        }

        const promises = [];

        section.isDownloading = true;

        // Sync the modules first.
        promises.push(this.prefetchDelegate.syncModules(section.modules, courseId).then(() => {
            // Validate the section needs to be downloaded and calculate amount of modules that need to be downloaded.
            return this.prefetchDelegate.getModulesStatus(section.modules, courseId, section.id).then((result) => {
                if (result.status == CoreConstants.DOWNLOADED || result.status == CoreConstants.NOT_DOWNLOADABLE) {
                    // Section is downloaded or not downloadable, nothing to do.

                    return ;
                }

                return this.prefetchSingleSection(section, result, courseId);
            }, (error) => {
                section.isDownloading = false;

                return Promise.reject(error);
            });
        }));

        // Download the files in the section description.
        const introFiles = this.domUtils.extractDownloadableFilesFromHtmlAsFakeFileObjects(section.summary),
            siteId = this.sitesProvider.getCurrentSiteId();

        promises.push(this.filepoolProvider.addFilesToQueue(siteId, introFiles, CoreCourseProvider.COMPONENT, courseId)
                .catch(() => {
            // Ignore errors.
        }));

        return Promise.all(promises);
    }

    /**
     * Start or restore the prefetch of a section.
     * If the section is "All sections" it will be ignored.
     *
     * @param {any} section Section to download.
     * @param {any} result Result of CoreCourseModulePrefetchDelegate.getModulesStatus for this section.
     * @param {number} courseId Course ID the section belongs to.
     * @return {Promise<any>} Promise resolved when the section has been prefetched.
     */
    protected prefetchSingleSection(section: any, result: any, courseId: number): Promise<any> {
        if (section.id == CoreCourseProvider.ALL_SECTIONS_ID) {
            return Promise.resolve();
        }

        if (section.total > 0) {
            // Already being downloaded.
            return Promise.resolve();
        }

        // We only download modules with status notdownloaded, downloading or outdated.
        const modules = result[CoreConstants.OUTDATED].concat(result[CoreConstants.NOT_DOWNLOADED])
                .concat(result[CoreConstants.DOWNLOADING]),
            downloadId = this.getSectionDownloadId(section);

        section.isDownloading = true;

        // Prefetch all modules to prevent incoeherences in download count and to download stale data not marked as outdated.
        return this.prefetchDelegate.prefetchModules(downloadId, modules, courseId, (data) => {
            section.count = data.count;
            section.total = data.total;
        });
    }

    /**
     * Check if a section has content.
     *
     * @param {any} section Section to check.
     * @return {boolean} Whether the section has content.
     */
    sectionHasContent(section: any): boolean {
        if (section.hiddenbynumsections) {
            return false;
        }

        return (typeof section.availabilityinfo != 'undefined' && section.availabilityinfo != '') ||
            section.summary != '' || (section.modules && section.modules.length > 0);
    }

    /**
     * Wait for any course format plugin to load, and open the course page.
     *
     * If the plugin's promise is resolved, the course page will be opened.  If it is rejected, they will see an error.
     * If the promise for the plugin is still in progress when the user tries to open the course, a loader
     * will be displayed until it is complete, before the course page is opened.  If the promise is already complete,
     * they will see the result immediately.
     *
     * @param {NavController} navCtrl The nav controller to use. If not defined, the course will be opened in main menu.
     * @param {any} course Course to open
     * @param {any} [params] Params to pass to the course page.
     * @param {string} [siteId] Site ID. If not defined, current site.
     * @return {Promise<any>} Promise resolved when done.
     */
    openCourse(navCtrl: NavController, course: any, params?: any, siteId?: string): Promise<any> {
        if (!siteId || siteId == this.sitesProvider.getCurrentSiteId()) {
            // Current site, we can open the course.
            return this.courseProvider.openCourse(navCtrl, course, params);
        } else {
            // We need to load the site first.
            params = params || {};
            Object.assign(params, { course: course });

            return this.loginHelper.redirect(CoreLoginHelperProvider.OPEN_COURSE, params, siteId);
        }
    }
}
