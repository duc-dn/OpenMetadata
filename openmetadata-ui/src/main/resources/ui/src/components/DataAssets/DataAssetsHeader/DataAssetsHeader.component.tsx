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
import Icon from '@ant-design/icons';
import { Button, Col, Divider, Row, Space, Tooltip, Typography } from 'antd';
import ButtonGroup from 'antd/lib/button/button-group';
import { AxiosError } from 'axios';
import classNames from 'classnames';
import { get, isEmpty } from 'lodash';
import QueryString from 'qs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useHistory, useParams } from 'react-router-dom';
import { ReactComponent as IconExternalLink } from '../../../assets/svg/external-links.svg';
import { ReactComponent as RedAlertIcon } from '../../../assets/svg/ic-alert-red.svg';
import { ReactComponent as TaskOpenIcon } from '../../../assets/svg/ic-open-task.svg';
import { ReactComponent as VersionIcon } from '../../../assets/svg/ic-version.svg';
import { ReactComponent as LinkIcon } from '../../../assets/svg/link-icon-with-bg.svg';
import { ReactComponent as TriggerIcon } from '../../../assets/svg/trigger.svg';
import { ActivityFeedTabs } from '../../../components/ActivityFeed/ActivityFeedTab/ActivityFeedTab.interface';
import { DomainLabel } from '../../../components/common/DomainLabel/DomainLabel.component';
import { OwnerLabel } from '../../../components/common/OwnerLabel/OwnerLabel.component';
import TierCard from '../../../components/common/TierCard/TierCard';
import EntityHeaderTitle from '../../../components/Entity/EntityHeaderTitle/EntityHeaderTitle.component';
import { DAY_ONE_EXPERIENCE_APP_NAME } from '../../../constants/Applications.constant';
import { DATA_ASSET_ICON_DIMENSION } from '../../../constants/constants';
import { SERVICE_TYPES } from '../../../constants/Services.constant';
import { TAG_START_WITH } from '../../../constants/Tag.constants';
import { useTourProvider } from '../../../context/TourProvider/TourProvider';
import {
  EntityTabs,
  EntityType,
  TabSpecificField,
} from '../../../enums/entity.enum';
import { ServiceCategory } from '../../../enums/service.enum';
import { LineageLayer } from '../../../generated/configuration/lineageSettings';
import { Container } from '../../../generated/entity/data/container';
import { Table } from '../../../generated/entity/data/table';
import { Thread } from '../../../generated/entity/feed/thread';
import { useApplicationStore } from '../../../hooks/useApplicationStore';
import { SearchSourceAlias } from '../../../interface/search.interface';
import { triggerOnDemandApp } from '../../../rest/applicationAPI';
import { getActiveAnnouncement } from '../../../rest/feedsAPI';
import { getDataQualityLineage } from '../../../rest/lineageAPI';
import { getContainerByName } from '../../../rest/storageAPI';
import {
  getDataAssetsHeaderInfo,
  getEntityExtraInfoLength,
  isDataAssetsWithServiceField,
} from '../../../utils/DataAssetsHeader.utils';
import EntityLink from '../../../utils/EntityLink';
import entityUtilClassBase from '../../../utils/EntityUtilClassBase';
import {
  getEntityFeedLink,
  getEntityName,
  getEntityVoteStatus,
} from '../../../utils/EntityUtils';
import { getEntityDetailsPath } from '../../../utils/RouterUtils';
import serviceUtilClassBase from '../../../utils/ServiceUtilClassBase';
import { getEntityTypeFromServiceCategory } from '../../../utils/ServiceUtils';
import tableClassBase from '../../../utils/TableClassBase';
import { getTierTags } from '../../../utils/TableUtils';
import { showErrorToast } from '../../../utils/ToastUtils';
import CertificationTag from '../../common/CertificationTag/CertificationTag';
import AnnouncementCard from '../../common/EntityPageInfos/AnnouncementCard/AnnouncementCard';
import AnnouncementDrawer from '../../common/EntityPageInfos/AnnouncementDrawer/AnnouncementDrawer';
import ManageButton from '../../common/EntityPageInfos/ManageButton/ManageButton';
import { EditIconButton } from '../../common/IconButtons/EditIconButton';
import TitleBreadcrumb from '../../common/TitleBreadcrumb/TitleBreadcrumb.component';
import RetentionPeriod from '../../Database/RetentionPeriod/RetentionPeriod.component';
import Voting from '../../Entity/Voting/Voting.component';
import { VotingDataProps } from '../../Entity/Voting/voting.interface';
import MetricHeaderInfo from '../../Metric/MetricHeaderInfo/MetricHeaderInfo';
import SuggestionsAlert from '../../Suggestions/SuggestionsAlert/SuggestionsAlert';
import { useSuggestionsContext } from '../../Suggestions/SuggestionsProvider/SuggestionsProvider';
import TagsV1 from '../../Tag/TagsV1/TagsV1.component';
import './data-asset-header.less';
import {
  DataAssetHeaderInfo,
  DataAssetsHeaderProps,
  DataAssetsWithFollowersField,
  EntitiesWithDomainField,
} from './DataAssetsHeader.interface';

export const ExtraInfoLabel = ({
  label,
  value,
  dataTestId,
  inlineLayout = false,
}: {
  label: string;
  value: string | number | React.ReactNode;
  dataTestId?: string;
  inlineLayout?: boolean;
}) => {
  if (inlineLayout) {
    return (
      <>
        <Divider className="self-center" type="vertical" />
        <Typography.Text
          className="self-center text-xs whitespace-nowrap"
          data-testid={dataTestId}>
          {!isEmpty(label) && (
            <span className="text-grey-muted">{`${label}: `}</span>
          )}
          <span className="font-medium">{value}</span>
        </Typography.Text>
      </>
    );
  }

  return (
    <div className="d-flex align-start extra-info-container">
      <Typography.Text
        className="whitespace-nowrap text-sm d-flex flex-col gap-2"
        data-testid={dataTestId}>
        {!isEmpty(label) && (
          <span className="extra-info-label-heading">{label}</span>
        )}
        <div className={classNames('font-medium extra-info-value')}>
          {value}
        </div>
      </Typography.Text>
    </div>
  );
};

export const ExtraInfoLink = ({
  label,
  value,
  href,
  newTab = false,
  ellipsis = false,
}: {
  label: string;
  value: string | number;
  href: string;
  newTab?: boolean;
  ellipsis?: boolean;
}) => (
  <div
    className={classNames('d-flex  text-sm  flex-col gap-2', {
      'w-48': ellipsis,
    })}>
    {!isEmpty(label) && (
      <span className="extra-info-label-heading  m-r-xss">{label}</span>
    )}
    <div className="d-flex items-center gap-1">
      <Tooltip title={value}>
        <Typography.Link
          ellipsis
          className="extra-info-link"
          href={href}
          rel={newTab ? 'noopener noreferrer' : undefined}
          target={newTab ? '_blank' : undefined}>
          {value}
        </Typography.Link>
      </Tooltip>
      <Icon
        className="m-l-xs"
        component={IconExternalLink}
        style={DATA_ASSET_ICON_DIMENSION}
      />
    </div>
  </div>
);

export const DataAssetsHeader = ({
  allowSoftDelete = true,
  showDomain = true,
  afterDeleteAction,
  dataAsset,
  onUpdateVote,
  onOwnerUpdate,
  onTierUpdate,
  permissions,
  onVersionClick,
  onFollowClick,
  entityType,
  openTaskCount,
  isRecursiveDelete,
  onRestoreDataAsset,
  onDisplayNameUpdate,
  afterDomainUpdateAction,
  onProfilerSettingUpdate,
  onUpdateRetentionPeriod,
  extraDropdownContent,
  onMetricUpdate,
  badge,
  isDqAlertSupported,
  isCustomizedView = false,
  disableRunAgentsButton = true,
  afterTriggerAction,
  isDayOneWorkflowStatusLoading = false,
}: DataAssetsHeaderProps) => {
  const { serviceCategory } = useParams<{ serviceCategory: ServiceCategory }>();
  const { currentUser } = useApplicationStore();
  const { selectedUserSuggestions } = useSuggestionsContext();
  const USER_ID = currentUser?.id ?? '';
  const { t } = useTranslation();
  const { isTourPage } = useTourProvider();
  const [parentContainers, setParentContainers] = useState<Container[]>([]);
  const [isBreadcrumbLoading, setIsBreadcrumbLoading] = useState(false);
  const [dqFailureCount, setDqFailureCount] = useState(0);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const history = useHistory();
  const [isDayOneTriggering, setIsDayOneTriggering] = useState(false);
  const icon = useMemo(() => {
    const serviceType = get(dataAsset, 'serviceType', '');

    return serviceType ? (
      <img
        alt={get(dataAsset, 'service.displayName', '')}
        className="header-icon"
        src={serviceUtilClassBase.getServiceTypeLogo(
          dataAsset as SearchSourceAlias
        )}
      />
    ) : null;
  }, [dataAsset]);

  const excludeEntityService = useMemo(
    () =>
      [
        EntityType.DATABASE,
        EntityType.DATABASE_SCHEMA,
        EntityType.API_COLLECTION,
        ...SERVICE_TYPES,
      ].includes(entityType),
    [entityType]
  );

  const hasFollowers = 'followers' in dataAsset;

  const { entityName, tier, isFollowing, version, followers, votes, deleted } =
    useMemo(
      () => ({
        isFollowing: hasFollowers
          ? (dataAsset as DataAssetsWithFollowersField).followers?.some(
              ({ id }) => id === USER_ID
            )
          : false,
        followers: hasFollowers
          ? (dataAsset as DataAssetsWithFollowersField).followers?.length
          : 0,

        tier: getTierTags(dataAsset.tags ?? []),
        entityName: getEntityName(dataAsset),
        version: dataAsset.version,
        deleted: dataAsset.deleted,
        votes: (dataAsset as DataAssetsWithFollowersField).votes,
      }),
      [dataAsset, USER_ID]
    );

  const voteStatus = useMemo(
    () => getEntityVoteStatus(USER_ID, votes),
    [votes, USER_ID]
  );

  const [isAnnouncementDrawerOpen, setIsAnnouncementDrawerOpen] =
    useState<boolean>(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState<Thread>();

  const fetchDQFailureCount = async () => {
    if (!tableClassBase.getAlertEnableStatus() && !isDqAlertSupported) {
      setDqFailureCount(0);

      return;
    }

    // Todo: Remove this once we have support for count in API
    try {
      const data = await getDataQualityLineage(
        dataAsset.fullyQualifiedName ?? '',
        {
          upstreamDepth: 1,
        }
      );

      const updatedNodes =
        data.nodes?.filter(
          (node) => node?.fullyQualifiedName !== dataAsset?.fullyQualifiedName
        ) ?? [];
      setDqFailureCount(updatedNodes.length);
    } catch {
      setDqFailureCount(0);
    }
  };

  const alertBadge = useMemo(() => {
    return tableClassBase.getAlertEnableStatus() &&
      dqFailureCount > 0 &&
      isDqAlertSupported ? (
      <Space size={8}>
        {badge}
        <Tooltip placement="right" title={t('label.check-upstream-failure')}>
          <Link
            to={{
              pathname: getEntityDetailsPath(
                entityType,
                dataAsset?.fullyQualifiedName ?? '',
                EntityTabs.LINEAGE
              ),

              search: QueryString.stringify({
                layers: [LineageLayer.DataObservability],
              }),
            }}>
            <RedAlertIcon className="text-red-3" height={24} width={24} />
          </Link>
        </Tooltip>
      </Space>
    ) : (
      badge
    );
  }, [dqFailureCount, dataAsset?.fullyQualifiedName, entityType, badge]);

  const fetchActiveAnnouncement = async () => {
    try {
      const announcements = await getActiveAnnouncement(
        getEntityFeedLink(entityType, dataAsset.fullyQualifiedName ?? '')
      );

      if (!isEmpty(announcements.data)) {
        setActiveAnnouncement(announcements.data[0]);
      }
    } catch (error) {
      showErrorToast(error as AxiosError);
    }
  };

  const fetchContainerParent = async (
    parentName: string,
    parents = [] as Container[]
  ) => {
    if (isEmpty(parentName)) {
      return;
    }
    setIsBreadcrumbLoading(true);
    try {
      const response = await getContainerByName(parentName, {
        fields: TabSpecificField.PARENT,
      });
      const updatedParent = [response, ...parents];
      if (response?.parent?.fullyQualifiedName) {
        await fetchContainerParent(
          response.parent.fullyQualifiedName,
          updatedParent
        );
      } else {
        setParentContainers(updatedParent);
      }
    } catch (error) {
      showErrorToast(error as AxiosError, t('server.unexpected-response'));
    } finally {
      setIsBreadcrumbLoading(false);
    }
  };

  useEffect(() => {
    if (dataAsset.fullyQualifiedName && !isTourPage && !isCustomizedView) {
      fetchActiveAnnouncement();
      fetchDQFailureCount();
    }
    if (entityType === EntityType.CONTAINER && !isCustomizedView) {
      const asset = dataAsset as Container;
      fetchContainerParent(asset.parent?.fullyQualifiedName ?? '');
    }
  }, [dataAsset.fullyQualifiedName, isTourPage, isCustomizedView]);

  const { extraInfo, breadcrumbs }: DataAssetHeaderInfo = useMemo(
    () =>
      getDataAssetsHeaderInfo(
        entityType,
        dataAsset,
        entityName,
        parentContainers
      ),
    [entityType, dataAsset, entityName, parentContainers]
  );

  const showCompressedExtraInfoItems = useMemo(
    () => getEntityExtraInfoLength(extraInfo) <= 1,
    [extraInfo]
  );

  const handleOpenTaskClick = () => {
    if (!dataAsset.fullyQualifiedName) {
      return;
    }

    history.push(
      entityUtilClassBase.getEntityLink(
        entityType,
        dataAsset.fullyQualifiedName,
        EntityTabs.ACTIVITY_FEED,
        ActivityFeedTabs.TASKS
      )
    );
  };

  const dataAssetServiceName = useMemo(() => {
    if (isDataAssetsWithServiceField(dataAsset)) {
      return dataAsset.service?.name ?? '';
    } else {
      return 'service';
    }
  }, [isDataAssetsWithServiceField, dataAsset]);

  const handleVoteChange = async (data: VotingDataProps) => {
    await onUpdateVote?.(data, dataAsset.id ?? '');
  };

  const handleOpenAnnouncementDrawer = useCallback(
    () => setIsAnnouncementDrawerOpen(true),
    []
  );

  const handleCloseAnnouncementDrawer = useCallback(
    () => setIsAnnouncementDrawerOpen(false),
    []
  );
  const handleFollowingClick = useCallback(async () => {
    setIsFollowingLoading(true);
    await onFollowClick?.();
    setIsFollowingLoading(false);
  }, [onFollowClick]);

  const { editDomainPermission, editOwnerPermission, editTierPermission } =
    useMemo(
      () => ({
        editDomainPermission: permissions.EditAll && !dataAsset.deleted,
        editOwnerPermission:
          (permissions.EditAll || permissions.EditOwners) && !dataAsset.deleted,
        editTierPermission:
          (permissions.EditAll || permissions.EditTier) && !dataAsset.deleted,
      }),
      [permissions, dataAsset]
    );

  const tierSuggestionRender = useMemo(() => {
    if (entityType === EntityType.TABLE) {
      const entityLink = EntityLink.getTableEntityLink(
        dataAsset.fullyQualifiedName ?? ''
      );

      const activeSuggestion = selectedUserSuggestions?.tags.find(
        (suggestion) =>
          suggestion.entityLink === entityLink &&
          getTierTags(suggestion.tagLabels ?? [])
      );

      if (activeSuggestion) {
        return (
          <div className="w-auto" data-testid="tier-suggestion-container">
            <SuggestionsAlert
              showInlineCard
              hasEditAccess={editTierPermission}
              showSuggestedBy={false}
              suggestion={activeSuggestion}
            />
          </div>
        );
      }
    }

    return null;
  }, [
    entityType,
    dataAsset.fullyQualifiedName,
    editTierPermission,
    selectedUserSuggestions,
  ]);

  const triggerTheDayOneApplication = useCallback(async () => {
    try {
      setIsDayOneTriggering(true);
      const entityType = getEntityTypeFromServiceCategory(serviceCategory);
      const entityLink = getEntityFeedLink(
        entityType,
        dataAsset.fullyQualifiedName ?? ''
      );

      await triggerOnDemandApp(DAY_ONE_EXPERIENCE_APP_NAME, {
        entityLink,
      });

      afterTriggerAction?.();
    } catch (err) {
      showErrorToast(err as AxiosError);
    } finally {
      setIsDayOneTriggering(false);
    }
  }, [serviceCategory, afterTriggerAction]);

  const triggerDayOneApplicationButton = useMemo(() => {
    if (!SERVICE_TYPES.includes(entityType)) {
      return null;
    }

    const isDisabled = isDayOneWorkflowStatusLoading || disableRunAgentsButton;
    const isLoading = isDayOneWorkflowStatusLoading || isDayOneTriggering;

    return (
      <Tooltip title={t('message.trigger-day-one-application')}>
        <Button
          className="font-semibold"
          data-testid="trigger-day-one-application-button"
          disabled={isDisabled}
          icon={<Icon className="flex-center" component={TriggerIcon} />}
          loading={isLoading}
          type="primary"
          onClick={triggerTheDayOneApplication}>
          {t('label.run-agent-plural')}
        </Button>
      </Tooltip>
    );
  }, [
    disableRunAgentsButton,
    isDayOneWorkflowStatusLoading,
    isDayOneTriggering,
    triggerTheDayOneApplication,
  ]);

  return (
    <>
      <Row
        className="data-assets-header-container"
        data-testid="data-assets-header"
        gutter={[0, 20]}>
        <Col
          className={classNames('d-flex flex-col gap-3 ', {
            'p-l-xs': isCustomizedView,
          })}
          span={24}>
          <TitleBreadcrumb
            loading={isBreadcrumbLoading}
            titleLinks={breadcrumbs.map((link) =>
              isCustomizedView ? { ...link, url: '', noLink: true } : link
            )}
          />
          <Row>
            <Col flex="auto">
              <EntityHeaderTitle
                badge={alertBadge}
                deleted={dataAsset?.deleted}
                displayName={dataAsset.displayName}
                entityType={entityType}
                excludeEntityService={excludeEntityService}
                followers={followers}
                handleFollowingClick={handleFollowingClick}
                icon={icon}
                isCustomizedView={isCustomizedView}
                isFollowing={isFollowing}
                isFollowingLoading={isFollowingLoading}
                name={dataAsset?.name}
                serviceName={dataAssetServiceName}
              />
            </Col>
            <Col className="flex items-center">
              <Space className="">
                <ButtonGroup
                  className="data-asset-button-group spaced"
                  data-testid="asset-header-btn-group"
                  size="small">
                  {triggerDayOneApplicationButton}
                  {onUpdateVote && (
                    <Voting
                      disabled={deleted}
                      voteStatus={voteStatus}
                      votes={votes}
                      onUpdateVote={handleVoteChange}
                    />
                  )}
                  {!excludeEntityService && (openTaskCount ?? 0) > 0 && (
                    <Tooltip title={t('label.open-task-plural')}>
                      <Button
                        icon={<Icon component={TaskOpenIcon} />}
                        onClick={handleOpenTaskClick}>
                        <Typography.Text>{openTaskCount}</Typography.Text>
                      </Button>
                    </Tooltip>
                  )}

                  <Tooltip title={t('label.version-plural-history')}>
                    <Button
                      className="version-button"
                      data-testid="version-button"
                      icon={<Icon component={VersionIcon} />}
                      onClick={onVersionClick}>
                      <Typography.Text>{version}</Typography.Text>
                    </Button>
                  </Tooltip>

                  {(dataAsset as Table).sourceUrl && (
                    <Tooltip title={t('label.source-url')}>
                      <Typography.Link
                        className="cursor-pointer"
                        href={(dataAsset as Table).sourceUrl}
                        target="_blank">
                        <Button
                          className="source-url-button cursor-pointer font-semibold"
                          data-testid="source-url-button"
                          icon={
                            <Icon
                              className="flex-center"
                              component={LinkIcon}
                            />
                          }>
                          {t('label.view-in-service-type', {
                            serviceType: (dataAsset as Table).serviceType,
                          })}
                        </Button>
                      </Typography.Link>
                    </Tooltip>
                  )}
                  <ManageButton
                    isAsyncDelete
                    afterDeleteAction={afterDeleteAction}
                    allowSoftDelete={!dataAsset.deleted && allowSoftDelete}
                    canDelete={permissions.Delete}
                    deleted={dataAsset.deleted}
                    displayName={getEntityName(dataAsset)}
                    editDisplayNamePermission={
                      permissions?.EditAll || permissions?.EditDisplayName
                    }
                    entityFQN={dataAsset.fullyQualifiedName}
                    entityId={dataAsset.id}
                    entityName={dataAsset.name}
                    entityType={entityType}
                    extraDropdownContent={extraDropdownContent}
                    isRecursiveDelete={isRecursiveDelete}
                    onAnnouncementClick={
                      permissions?.EditAll
                        ? handleOpenAnnouncementDrawer
                        : undefined
                    }
                    onEditDisplayName={onDisplayNameUpdate}
                    onProfilerSettingUpdate={onProfilerSettingUpdate}
                    onRestoreEntity={onRestoreDataAsset}
                  />
                </ButtonGroup>
              </Space>
            </Col>
          </Row>
        </Col>

        <Col span={24}>
          <div
            className={classNames('data-asset-header-metadata ', {
              'data-asset-header-less-items': showCompressedExtraInfoItems,
            })}>
            {showDomain && (
              <>
                <DomainLabel
                  headerLayout
                  afterDomainUpdateAction={afterDomainUpdateAction}
                  domain={(dataAsset as EntitiesWithDomainField).domain}
                  entityFqn={dataAsset.fullyQualifiedName ?? ''}
                  entityId={dataAsset.id ?? ''}
                  entityType={entityType}
                  hasPermission={editDomainPermission}
                  textClassName="render-domain-lebel-style"
                />
                <Divider
                  className="self-center vertical-divider"
                  type="vertical"
                />
              </>
            )}
            <OwnerLabel
              hasPermission={editOwnerPermission}
              isCompactView={false}
              maxVisibleOwners={4}
              owners={dataAsset?.owners}
              onUpdate={onOwnerUpdate}
            />
            <Divider className="self-center vertical-divider" type="vertical" />
            {tierSuggestionRender ?? (
              <TierCard currentTier={tier?.tagFQN} updateTier={onTierUpdate}>
                <Space
                  className="d-flex tier-container align-start"
                  data-testid="header-tier-container">
                  {tier ? (
                    <div className="d-flex flex-col gap-2">
                      <div className="tier-heading-container d-flex items-center gap-1">
                        <span className="entity-no-tier ">
                          {t('label.tier')}
                        </span>

                        {editTierPermission && (
                          <EditIconButton
                            newLook
                            data-testid="edit-tier"
                            size="small"
                            title={t('label.edit-entity', {
                              entity: t('label.tier'),
                            })}
                          />
                        )}
                      </div>

                      <TagsV1
                        startWith={TAG_START_WITH.SOURCE_ICON}
                        tag={tier}
                        tagProps={{
                          'data-testid': 'Tier',
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center flex-col gap-2">
                      <div className="tier-heading-container d-flex items-center gap-1">
                        <span className="entity-no-tier">
                          {t('label.tier')}
                        </span>
                        {editTierPermission && (
                          <EditIconButton
                            newLook
                            data-testid="edit-tier"
                            size="small"
                            title={t('label.edit-entity', {
                              entity: t('label.tier'),
                            })}
                          />
                        )}
                      </div>
                      <span
                        className="font-medium no-tier-text text-sm"
                        data-testid="Tier">
                        {t('label.no-entity', {
                          entity: t('label.tier'),
                        })}
                      </span>
                    </div>
                  )}
                </Space>
              </TierCard>
            )}

            {entityType === EntityType.TABLE && onUpdateRetentionPeriod && (
              <>
                <Divider
                  className="self-center vertical-divider"
                  type="vertical"
                />
                <RetentionPeriod
                  hasPermission={permissions.EditAll && !dataAsset.deleted}
                  retentionPeriod={(dataAsset as Table).retentionPeriod}
                  onUpdate={onUpdateRetentionPeriod}
                />
              </>
            )}

            {entityType === EntityType.METRIC && onMetricUpdate && (
              <MetricHeaderInfo
                metricDetails={dataAsset}
                metricPermissions={permissions}
                onUpdateMetricDetails={onMetricUpdate}
              />
            )}

            {(dataAsset as Table)?.certification && (
              <>
                <Divider
                  className="self-center vertical-divider"
                  type="vertical"
                />
                <ExtraInfoLabel
                  label={t('label.certification')}
                  value={
                    <CertificationTag
                      showName
                      certification={(dataAsset as Table).certification!}
                    />
                  }
                />
              </>
            )}
            {extraInfo}
          </div>
          <div className="mt-2">
            {activeAnnouncement && (
              <AnnouncementCard
                announcement={activeAnnouncement}
                onClick={handleOpenAnnouncementDrawer}
              />
            )}
          </div>
        </Col>
      </Row>

      {isAnnouncementDrawerOpen && (
        <AnnouncementDrawer
          createPermission={permissions?.EditAll}
          entityFQN={dataAsset.fullyQualifiedName ?? ''}
          entityType={entityType}
          open={isAnnouncementDrawerOpen}
          onClose={handleCloseAnnouncementDrawer}
        />
      )}
    </>
  );
};
