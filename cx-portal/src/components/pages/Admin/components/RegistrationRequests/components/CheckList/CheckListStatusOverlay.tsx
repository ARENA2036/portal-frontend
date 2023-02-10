/********************************************************************************
 * Copyright (c) 2021, 2023 Mercedes-Benz Group AG and BMW Group AG
 * Copyright (c) 2021, 2023 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/

import React, { useEffect, useReducer } from 'react'
import MuiDialog from '@mui/material/Dialog'
import MuiDialogContent from '@mui/material/DialogContent'
import MuiDialogActions from '@mui/material/DialogActions'
import {
  Button,
  CircleProgress,
  Input,
  Typography,
} from 'cx-portal-shared-components'
import CheckList from '.'
import {
  ProgressButtonsProps,
  ProgressStatus,
  StatusType,
  useApproveChecklistMutation,
  useDeclineChecklistMutation,
  useFetchCheckListDetailsQuery,
} from 'features/admin/applicationRequestApiSlice'
import { useTranslation } from 'react-i18next'

interface CheckListStatusOverlayProps {
  openDialog?: boolean
  handleOverlayClose: React.MouseEventHandler
  selectedButton?: ProgressButtonsProps
  modalWidth?: string
  selectedRequestId: string
}

enum ActionKind {
  SET_CANCEL_LOADING = 'SET_CANCEL_LOADING',
  SET_RETRIGGER_LOADING = 'SET_RETRIGGER_LOADING',
  SET_APPROVE_LOADING = 'SET_APPROVE_LOADING',
  SET_DECLINE_LOADING = 'SET_DECLINE_LOADING',
  SET_SELECTED_CHECKLISTBUTTON = 'SET_SELECTED_CHECKLISTBUTTON',
  SET_CHECKLIST_BUTTONS = 'SET_CHECKLIST_BUTTONS',
  SET_ERROR = 'SET_ERROR',
  SET_CHECKLISTBUTTONS_AND_SELECTEDBUTTON = 'SET_CHECKLISTBUTTONS_AND_SELECTEDBUTTON',
  SET_SHOW_INPUT = 'SET_SHOW_INPUT',
  STOP_DECLINE_LOADIN_SHOW_INPUT = 'STOP_DECLINE_LOADIN_SHOW_INPUT',
  SET_DECLINE_COMMENT = 'SET_DECLINE_COMMENT',
}

type State = {
  cancelLoading: boolean
  retriggerLoading: boolean
  approveLoading: boolean
  declineLoading: boolean
  selectedCheckListButton: ProgressButtonsProps
  checkListButton: ProgressButtonsProps[]
  error: string
  showInput: boolean
  declineComment: string
}

const initialState: State = {
  cancelLoading: false,
  retriggerLoading: false,
  approveLoading: false,
  declineLoading: false,
  selectedCheckListButton: {
    statusId: ProgressStatus.DONE,
    typeId: StatusType.BUSINESS_PARTNER_NUMBER,
  },
  checkListButton: [],
  error: '',
  showInput: false,
  declineComment: '',
}

type Action = {
  type: string
  payload: any
}

function reducer(state: State, { type, payload }: Action) {
  switch (type) {
    case ActionKind.SET_CANCEL_LOADING:
      return { ...state, cancelLoading: payload }
    case ActionKind.SET_RETRIGGER_LOADING:
      return { ...state, retriggerLoading: payload }
    case ActionKind.SET_APPROVE_LOADING:
      return { ...state, approveLoading: payload }
    case ActionKind.SET_DECLINE_LOADING:
      return { ...state, declineLoading: payload }
    case ActionKind.SET_SELECTED_CHECKLISTBUTTON:
      return { ...state, selectedCheckListButton: payload }
    case ActionKind.SET_CHECKLIST_BUTTONS:
      return { ...state, checkListButton: payload }
    case ActionKind.SET_ERROR:
      return { ...state, error: payload }
    case ActionKind.SET_SHOW_INPUT:
      return { ...state, showInput: payload }
    case ActionKind.SET_CHECKLISTBUTTONS_AND_SELECTEDBUTTON:
      return {
        ...state,
        selectedCheckListButton: payload.selected,
        checkListButton: payload.buttons,
      }
    case ActionKind.STOP_DECLINE_LOADIN_SHOW_INPUT:
      return {
        ...state,
        declineLoading: payload.declineLoading,
        showInput: payload.showInput,
      }
    case ActionKind.SET_DECLINE_COMMENT:
      return {
        ...state,
        declineComment: payload,
      }
    default:
      return state
  }
}

const CheckListStatusOverlay = ({
  openDialog = false,
  handleOverlayClose,
  selectedButton,
  modalWidth = '900',
  selectedRequestId,
}: CheckListStatusOverlayProps) => {
  const { t } = useTranslation()
  const [approveChecklist] = useApproveChecklistMutation()
  const [declineChecklist] = useDeclineChecklistMutation()
  const { data } = useFetchCheckListDetailsQuery(selectedRequestId)
  const [
    {
      cancelLoading,
      retriggerLoading,
      approveLoading,
      declineLoading,
      selectedCheckListButton,
      checkListButton,
      error,
      showInput,
      declineComment,
    },
    setState,
  ] = useReducer(reducer, initialState)

  useEffect(() => {
    setTimeout(() => {
      if (data && selectedButton) {
        setState({
          type: ActionKind.SET_CHECKLISTBUTTONS_AND_SELECTEDBUTTON,
          payload: {
            selected: data.find(
              (btn: ProgressButtonsProps) =>
                btn.typeId === selectedButton.typeId
            ),
            buttons: data,
          },
        })
      }
    }, 100)
  }, [data, selectedButton])

  const reset = (button: ProgressButtonsProps) => {
    setState({
      type: ActionKind.SET_CHECKLIST_BUTTONS,
      payload: data,
    })
    button.highlight = true
    setState({ type: ActionKind.SET_SELECTED_CHECKLISTBUTTON, payload: button })
  }

  const onUpdateComment = (e: any) => {
    setState({
      type: ActionKind.SET_DECLINE_COMMENT,
      payload: e.target.value,
    })
  }

  const onApprove = async () => {
    setState({ type: ActionKind.SET_APPROVE_LOADING, payload: true })
    await approveChecklist(selectedRequestId)
      .unwrap()
      .then((payload) => console.log('fulfilled', payload))
      .catch((error) =>
        setState({ type: ActionKind.SET_ERROR, payload: error.data.title })
      )
    setState({ type: ActionKind.SET_APPROVE_LOADING, payload: false })
  }

  const onDecline = () => {
    setState({ type: ActionKind.SET_SHOW_INPUT, payload: true })
  }

  const onConfirmDecline = async () => {
    setState({ type: ActionKind.SET_DECLINE_LOADING, payload: true })
    await declineChecklist({
      applicationId: selectedRequestId,
      comment: declineComment,
    })
      .unwrap()
      .then((payload) => console.log('fulfilled', payload))
      .catch((error) =>
        setState({ type: ActionKind.SET_ERROR, payload: error.data.title })
      )
    setState({
      type: ActionKind.STOP_DECLINE_LOADIN_SHOW_INPUT,
      payload: { declineLoading: false, showInput: false },
    })
  }

  const onCancel = () => {
    setState({ type: ActionKind.SET_CANCEL_LOADING, payload: true })
  }

  const onRetrigger = () => {
    setState({ type: ActionKind.SET_RETRIGGER_LOADING, payload: true })
  }

  const getStepName = () =>
    t(`content.checklistOverlay.${selectedCheckListButton?.typeId}.stepName`)

  const getAdditionalText = () =>
    t(
      `content.checklistOverlay.${selectedCheckListButton?.typeId}.additionalText`
    )

  const getStpeDescription = () =>
    t(
      `content.checklistOverlay.${selectedCheckListButton?.typeId}.stepDescription`
    )

  const getTitle = () =>
    t(
      `content.checklistOverlay.${selectedCheckListButton?.typeId}.${selectedCheckListButton?.statusId}.title`
    )

  const getDescription = () =>
    t(
      `content.checklistOverlay.${selectedCheckListButton?.typeId}.${selectedCheckListButton?.statusId}.description`
    )

  const canShowCancelAndRetrigger = () => selectedCheckListButton.retriggerable

  const canShowApproveAndDecline = () =>
    selectedCheckListButton?.typeId === StatusType.REGISTRATION_VERIFICATION &&
    selectedCheckListButton?.statusId === ProgressStatus.TO_DO

  return (
    <MuiDialog
      sx={{
        '.MuiPaper-root': {
          minWidth: `${modalWidth}px`,
          borderRadius: '40px',
        },
      }}
      open={openDialog}
    >
      <MuiDialogContent
        sx={{
          fontFamily: 'fontFamily',
          textAlign: 'center',
          padding: '60px 110px',
        }}
      >
        <div
          style={{
            marginBottom: '35px',
          }}
        >
          {checkListButton && checkListButton.length === 0 ? (
            <span
              style={{
                marginLeft: '25px',
                width: '116px',
                textAlign: 'center',
                height: '150px',
              }}
            >
              <CircleProgress
                size={40}
                step={1}
                interval={0.1}
                colorVariant={'primary'}
                variant={'indeterminate'}
                thickness={8}
              />
            </span>
          ) : (
            <CheckList
              progressButtons={checkListButton}
              showCancel={false}
              alignRow="center"
              selectedButton={selectedCheckListButton}
              onButtonClick={(button) => {
                reset(button)
              }}
            />
          )}
        </div>
        <div
          style={{
            textAlign: 'left',
            marginBottom: '30px',
          }}
        >
          <Typography
            sx={{
              paddingBottom: '10px',
              fontWeight: '600',
            }}
            variant="h3"
          >
            {getStepName()}
          </Typography>
          <Typography
            sx={{
              paddingBottom: getAdditionalText() !== '' ? '30px' : '10px',
            }}
            variant="body2"
          >
            {getStpeDescription()}
          </Typography>
          {getAdditionalText() !== '' && (
            <Typography
              sx={{
                paddingBottom: '10px',
              }}
              variant="body2"
            >
              {getAdditionalText()}
            </Typography>
          )}
        </div>
        <div
          style={{
            borderBottomWidth: '1px',
            borderColor: '#e3e3e3',
            borderBottomStyle: 'dashed',
          }}
        />
        <div
          style={{
            textAlign: 'left',
            marginTop: '30px',
            marginBottom: '30px',
          }}
        >
          <Typography
            sx={{
              paddingBottom: '10px',
              fontWeight: '600',
            }}
            variant="h6"
          >
            {t('content.checklistOverlay.comments')}
          </Typography>
          <Typography
            sx={{
              paddingBottom: '10px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: '2',
              WebkitBoxOrient: 'vertical',
              maxHeight: selectedCheckListButton?.details ? '50px' : '20px',
            }}
            variant="body2"
          >
            {selectedCheckListButton?.details
              ? selectedCheckListButton.details
              : t('content.checklistOverlay.nocomments')}
          </Typography>
        </div>
        <div
          style={{
            borderBottomWidth: '1px',
            borderColor: '#e3e3e3',
            borderBottomStyle: 'dashed',
          }}
        />
        <div
          style={{
            textAlign: 'left',
            marginTop: '30px',
            marginBottom: '10px',
          }}
        >
          <Typography
            sx={{
              paddingBottom: '10px',
              fontWeight: '600',
            }}
            variant="h6"
          >
            {getTitle()}
          </Typography>
          <Typography
            sx={{
              paddingBottom: '10px',
            }}
            variant="body2"
          >
            {getDescription()}
          </Typography>
        </div>
        {canShowCancelAndRetrigger() && (
          <div
            style={{
              display: 'flex',
              marginTop: '30px',
              marginBottom: '30px',
            }}
          >
            <div style={{ marginRight: '20px' }}>
              {retriggerLoading && (
                <span
                  style={{
                    marginRight: '75px',
                    marginLeft: '40px',
                    width: '116px',
                    textAlign: 'center',
                  }}
                >
                  <CircleProgress
                    size={40}
                    step={1}
                    interval={0.1}
                    colorVariant={'primary'}
                    variant={'indeterminate'}
                    thickness={8}
                  />
                </span>
              )}
              {!retriggerLoading && (
                <Button
                  onClick={() => onRetrigger()}
                  size="small"
                  variant="contained"
                  disabled={cancelLoading}
                >
                  {t('content.checklistOverlay.buttonRetrigger')}
                </Button>
              )}
            </div>
            <div>
              {cancelLoading && (
                <span
                  style={{
                    marginLeft: '50px',
                    width: '116px',
                    textAlign: 'center',
                  }}
                >
                  <CircleProgress
                    size={40}
                    step={1}
                    interval={0.1}
                    colorVariant={'primary'}
                    variant={'indeterminate'}
                    thickness={8}
                  />
                </span>
              )}
              {!cancelLoading && (
                <Button
                  onClick={() => onCancel()}
                  size="small"
                  variant="outlined"
                  disabled={retriggerLoading}
                >
                  {t('content.checklistOverlay.buttonCancel')}
                </Button>
              )}
            </div>
          </div>
        )}
        {showInput && (
          <>
            <div>
              <Input
                label={t(
                  'content.admin.registration-requests.confirmCancelModal.inputLabel'
                )}
                sx={{
                  paddingTop: '10px',
                }}
                multiline
                rows={2}
                maxRows={4}
                placeholder={''}
                onChange={(e: any) => {
                  onUpdateComment(e)
                }}
                value={declineComment}
              />
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: '30px',
                marginBottom: '30px',
              }}
            >
              <div style={{ marginRight: '20px' }}>
                {declineLoading && (
                  <span
                    style={{
                      marginRight: '50px',
                      width: '116px',
                      textAlign: 'center',
                    }}
                  >
                    <CircleProgress
                      size={40}
                      step={1}
                      interval={0.1}
                      colorVariant={'primary'}
                      variant={'indeterminate'}
                      thickness={8}
                    />
                  </span>
                )}
                {!declineLoading && (
                  <Button
                    onClick={() => onConfirmDecline()}
                    size="small"
                    variant="contained"
                  >
                    {t('content.checklistOverlay.buttonConfirm')}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
        {canShowApproveAndDecline() && !showInput && (
          <div
            style={{
              display: 'flex',
              marginTop: '30px',
              marginBottom: '30px',
            }}
          >
            <div style={{ marginRight: '10px' }}>
              {approveLoading && (
                <span
                  style={{
                    marginRight: '50px',
                    width: '116px',
                    textAlign: 'center',
                  }}
                >
                  <CircleProgress
                    size={40}
                    step={1}
                    interval={0.1}
                    colorVariant={'primary'}
                    variant={'indeterminate'}
                    thickness={8}
                  />
                </span>
              )}
              {!approveLoading && (
                <Button
                  onClick={() => onApprove()}
                  size="small"
                  variant="contained"
                  disabled={declineLoading}
                >
                  {t('content.checklistOverlay.buttonApprove')}
                </Button>
              )}
            </div>
            <div>
              <Button
                onClick={() => onDecline()}
                size="small"
                variant="outlined"
                disabled={approveLoading}
              >
                {t('content.checklistOverlay.buttonDecline')}
              </Button>
            </div>
          </div>
        )}
        {error !== '' && (
          <Typography
            sx={{
              textAlign: 'left',
            }}
            color="error"
            variant="body2"
          >
            {error}
          </Typography>
        )}
      </MuiDialogContent>
      <MuiDialogActions
        sx={{
          '&.MuiDialogActions-root': {
            background: '#EDF0F4',
            padding: '20px',
          },
        }}
      >
        <Button
          size="small"
          variant="contained"
          onClick={(e) => handleOverlayClose(e)}
        >
          {t('content.checklistOverlay.buttonClose')}
        </Button>
      </MuiDialogActions>
    </MuiDialog>
  )
}

export default CheckListStatusOverlay
