/* eslint-disable react-refresh/only-export-components */
import {Layout} from '@/app/layout';
import LogoGenerator from '@/app/logo-generator';
import Home from '@/app/routes/home/home';
import {MapGenerator} from '@/app/routes/map-gen/App';
import TilemapEditor from '@/game/tileMapper';
import {type RouteObject} from 'react-router-dom';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'map-gen',
        element: <MapGenerator />,
      },
      {
        path: 'logo',
        element: <LogoGenerator />,
      },
      {
        path: 'tile-editor',
        element: <TilemapEditor />,
      },
    ],
  },
];
