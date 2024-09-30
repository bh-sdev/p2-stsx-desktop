import { createContext, useEffect, useRef, useState } from 'react';

import { Splitter, SplitterPanel } from 'primereact/splitter';

import GoToRootWindow from 'pages/Application/components/GoToRootWindow';
import Piecemarks from './Piecemarks';
import InfoBlock from './InfoBlock';
import TopForm from './TopForm';
import useGetPermissions from 'hooks/useGetPermissions';
import ScreenId from 'const/screen.id';
import { addressGetCollection } from 'api';

export const ContextPiecemarkEntry = createContext({});

export const PIECEMARK_EMPTY = {
  PiecemarkEntry: {
    Desc: '',
    Finish: '',
    Grade: '',
    IDNumber: '',
    ItemLength: '',
    JobID: '',
    LoadNumber: '',
    LotNumber: '',
    Material: '',
    NumberOfLabels: '',
    ParentPiecemark: '',
    Piecemark: '',
    Quantity: '',
    RoutingCode: '',
    RoutingCodeID: '',
    SequenceNumber: '',
    SheetNumber: '',
    ShopOrder: '',
    WeightEach: '',
    Width: '',
  },
  PiecemarkInfo: {
    COWCode: '',
    COWQuantity: '',
    CostEach: '',
    Remarks: '',
    Camber: '',
    ProductType: '',
    Category: '',
    SubCategory: '',
    MaterialSpec: '',
    RuleCode: '',
    FireproofCubicJobRelated: '',
    HandlingMin: '',
    SawMin: '',
    WeldMin: '',
    FabMin: '',
    DetailMin: '',
    PaintMin: '',
    SheetNumber: '',
    ParentPiecemark: '',
    Piecemark: '',
    Material: '',
    Desc: '',
    PartSerial: '',
    Quantity: '',
    CowXRefID: '',
    RoutingCode: '',
    ItemWeightLb: '',
    ItemWeightKg: '',
    CreateDate: '',
    ItemLength: '',
    Width: '',
  },
  IDInfo: {
    Altitude: '',
    Area: '',
    BHNTest: false,
    Batch: '',
    ControlNumber: '',
    ErectionDrawing: '',
    FabInvoice: '',
    FinalQCTest: false,
    Finish: '',
    FtAssemblyID: 0,
    FtAssinID: 0,
    FtBatch: 0,
    FtLot: 0,
    FtPartID: 0,
    FtPkgID: 0,
    FtPkgNo: 0,
    FtSequenceID: 0,
    FtSideID: 0,
    HydroTest: false,
    Latitude: 0,
    Location: '',
    Longitude: 0,
    MRR: '',
    PMITest: false,
    PieceColor: '',
    PiecePhase: '',
    PieceRelease: '',
    ReferenceDate: '',
    Remarks: '',
    RequiredShipDate: '',
    RevisionLevel: '',
    ScheduledShipDate: '',
    StressTest: false,
    SummedQuantity: '',
  },
};

const PiecemarkEntry = () => {
  const { Delete, Edit, Create } = useGetPermissions(ScreenId.piecemarkEntry);
  const [job, setJob] = useState({});
  const [addresses, setAddresses] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [commonData, setCommonData] = useState({});

  const refLastSelected = useRef(null);

  useEffect(() => {
    if (job.CustomerID) {
      getAddresses();
    }
  }, [job]);

  const getAddresses = async () => {
    const { Addresses } = await addressGetCollection({
      person_id: job.CustomerID,
    });
    setAddresses(Addresses);
  };

  return (
    <ContextPiecemarkEntry.Provider
      value={{
        commonData,
        setCommonData: (data) => {
          setCommonData((prevState) => ({ ...prevState, ...data }));
        },
        created: (data) => {
          setTableData((prevState) => [...data, ...prevState]);
          setIsNew(false);
          setSelected(data.at(0));
        },
        updated: (data) => {
          setCommonData(data);
          if (data.PiecemarkEntry) {
            setTableData((prevState) => {
              prevState[prevState.indexOf(selected)] = {
                ...selected,
                Piecemark: data.PiecemarkEntry.Piecemark,
                ParentPiecemark: data.PiecemarkEntry.ParentPiecemark,
                SheetNumber: data.PiecemarkEntry.SheetNumber,
              };
              return prevState;
            });
          }
        },
        deleted: (deletedID) => {
          const UPDATED = tableData.filter(({ ID }) => ID !== deletedID);
          setSelected(UPDATED.at(0));
          setTableData(UPDATED);
        },
        setJob: (value) => {
          setJob(value);
          setCommonData(PIECEMARK_EMPTY);
          setSelected(null);
          refLastSelected.current = null;
        },
        job,
        addresses,
        selected,
        setSelected,
        isEdit,
        setIsEdit,
        isNew,
        setTableData,
        setIsNew: () => {
          setIsNew(true);
          if (selected) {
            refLastSelected.current = selected;
            setSelected(null);
          }
        },
        cancel: () => {
          if (isEdit) {
            setIsEdit(false);
          }
          if (isNew) {
            setIsNew(false);
            setSelected(refLastSelected.current);
            refLastSelected.current = null;
          }
        },
        tableData,
        Delete,
        Edit,
        Create,
      }}
    >
      <div id="piecemark-information" className="fadein grid grid-nogutter h-full flex flex-column">
        <div className="p-2 w-full flex justify-content-between">
          <TopForm />
          <GoToRootWindow />
        </div>
        <div className="flex-auto">
          <Splitter style={{ height: '100%' }}>
            <SplitterPanel size={20} className="p-2">
              <Piecemarks />
            </SplitterPanel>
            <SplitterPanel className="p-2">
              <InfoBlock />
            </SplitterPanel>
          </Splitter>
        </div>
      </div>
    </ContextPiecemarkEntry.Provider>
  );
};

export default PiecemarkEntry;
