/*
 *  Copyright 2023 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
import { upperFirst } from 'lodash';
import { StatusType } from '../components/common/StatusBadge/StatusBadge.interface';
import {
  EntityStats,
  EntityStatsData,
  EntityTypeSearchIndex,
} from '../components/Settings/Applications/AppLogsViewer/AppLogsViewer.interface';
import { Status } from '../generated/entity/applications/appRunRecord';

export const getStatusTypeForApplication = (status: Status) => {
  switch (status) {
    case Status.Failed:
      return StatusType.Failure;

    case Status.Success:
    case Status.Active:
    case Status.Completed:
      return StatusType.Success;

    case Status.Running:
      return StatusType.Running;

    case Status.Started:
      return StatusType.Started;

    case Status.Pending:
      return StatusType.Pending;

    case Status.ActiveError:
      return StatusType.ActiveError;

    default:
      return StatusType.Stopped;
  }
};
export const getEntityStatsData = (data: EntityStats): EntityStatsData[] => {
  const filteredRow = ['failedRecords', 'totalRecords', 'successRecords'];

  const result = Object.keys(data).reduce((acc, key) => {
    if (filteredRow.includes(key)) {
      return acc;
    }

    return [
      ...acc,
      {
        name: upperFirst(key),
        ...data[key as EntityTypeSearchIndex],
      },
    ];
  }, [] as EntityStatsData[]);

  return result.sort((a, b) => a.name.localeCompare(b.name));
};
