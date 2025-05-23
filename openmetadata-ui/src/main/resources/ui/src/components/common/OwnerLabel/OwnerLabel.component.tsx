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

import { Typography } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NoOwnerFound } from '../NoOwner/NoOwnerFound';
import { OwnerItem } from '../OwnerItem/OwnerItem';
import { OwnerReveal } from '../RemainingOwner/OwnerReveal';
import { UserTeamSelectableList } from '../UserTeamSelectableList/UserTeamSelectableList.component';
import './owner-label.less';
import { OwnerLabelProps } from './OwnerLabel.interface';

export const OwnerLabel = ({
  owners = [],
  showLabel = true,
  className,
  onUpdate,
  hasPermission,
  ownerDisplayName,
  placeHolder,
  maxVisibleOwners = 3, // Default to 3 if not provided
  multiple = {
    user: true,
    team: false,
  },
  tooltipText,
  isCompactView = true, // renders owner profile followed by its name
  avatarSize = 32,
}: OwnerLabelProps) => {
  const { t } = useTranslation();
  const [showAllOwners, setShowAllOwners] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const ownerElementsNonCompactView = useMemo(() => {
    if (!isCompactView) {
      if (showLabel || onUpdate) {
        return (
          <div className="d-flex items-center gap-2 m-b-xs">
            {showLabel && (
              <Typography.Text
                className={classNames(
                  'no-owner-heading font-medium text-sm',
                  className
                )}>
                {placeHolder ?? t('label.owner-plural')}
              </Typography.Text>
            )}
            {onUpdate && (
              <UserTeamSelectableList
                hasPermission={Boolean(hasPermission)}
                multiple={multiple}
                owner={owners}
                tooltipText={tooltipText}
                onUpdate={onUpdate}
              />
            )}
          </div>
        );
      }
    }

    return null;
  }, [
    isCompactView,
    showLabel,
    onUpdate,
    placeHolder,
    hasPermission,
    multiple,
    owners,
    tooltipText,
    className,
  ]);

  const ownerElements = useMemo(() => {
    const hasOwners = owners && owners.length > 0;

    // Show all owners when "more" is clicked, regardless of view mode
    const visibleOwners = showAllOwners
      ? owners
      : owners.slice(0, maxVisibleOwners);
    const remainingOwnersCount = owners.length - maxVisibleOwners;
    const showMoreButton = remainingOwnersCount > 0 && !showAllOwners;

    // If no owners, render the empty state
    if (!hasOwners) {
      return (
        <NoOwnerFound
          className={className}
          hasPermission={hasPermission}
          isCompactView={isCompactView}
          multiple={multiple}
          owners={owners}
          placeHolder={placeHolder}
          showLabel={showLabel}
          tooltipText={tooltipText}
          onUpdate={onUpdate}
        />
      );
    }

    return (
      <div
        className={classNames({
          'owner-label-container': !isCompactView,
          'd-flex owner-label-heading gap-2 items-center': isCompactView,
        })}
        data-testid="owner-label">
        {/* Owner avatars list */}
        {ownerElementsNonCompactView}
        <div
          className={classNames(
            'd-flex items-center w-full flex-wrap',
            {
              'gap-2': isCompactView,
              inherited: Boolean(owners.some((owner) => owner?.inherited)),
            },
            className
          )}>
          {visibleOwners.map((owner, index) => (
            <OwnerItem
              avatarSize={avatarSize}
              className={className}
              index={index}
              isCompactView={isCompactView}
              key={owner.id}
              owner={owner}
              ownerDisplayName={ownerDisplayName?.[index]}
            />
          ))}

          {/* Show more button/dropdown */}
          {showMoreButton && (
            <OwnerReveal
              avatarSize={avatarSize}
              isCompactView={isCompactView}
              isDropdownOpen={isDropdownOpen}
              owners={owners.slice(maxVisibleOwners)}
              remainingCount={remainingOwnersCount}
              setIsDropdownOpen={setIsDropdownOpen}
              setShowAllOwners={setShowAllOwners}
              showAllOwners={showAllOwners}
            />
          )}
        </div>

        {isCompactView && onUpdate && (
          <UserTeamSelectableList
            hasPermission={Boolean(hasPermission)}
            multiple={multiple}
            owner={owners}
            tooltipText={tooltipText}
            onUpdate={onUpdate}
          />
        )}
      </div>
    );
  }, [
    owners,
    className,
    onUpdate,
    hasPermission,
    showAllOwners,
    maxVisibleOwners,
    placeHolder,
    t,
    ownerDisplayName,
    isCompactView,
    isDropdownOpen,
    tooltipText,
    multiple,
    ownerElementsNonCompactView,
    avatarSize,
  ]);

  return ownerElements;
};
