/********************************************************************************
 * Copyright (c) 2021,2022 Mercedes-Benz Group AG and BMW Group AG
 * Copyright (c) 2021,2022 Contributors to the Eclipse Foundation
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

import { Box } from '@mui/material'
import { Typography } from '../../Typography'
import { ProviderProps } from '../StaticTypes'

export default function ImageTextSideBySide({
  provider,
}: {
  provider: ProviderProps
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: '0px 20px 0px 20px',
        padding: '90px 0px',
      }}
    >
      <img src={provider.imageUrl} width="482" alt={'alt tag info'} />
      <Box
        sx={{
          padding: '20px',
          width: '50%',
        }}
      >
        <Typography variant="h2">{provider.title}</Typography>
        <Typography
          sx={{
            paddingTop: '34px',
          }}
          variant="body1"
        >
          {provider.description}
        </Typography>
      </Box>
    </Box>
  )
}
