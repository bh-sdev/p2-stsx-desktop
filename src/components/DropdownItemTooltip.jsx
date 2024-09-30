import { Tooltip } from 'primereact/tooltip';

const DropdownItemTooltip = ({ id, label }) => {
  return (
    <>
      <Tooltip target={`#id_${id}`} position="top" />
      <div id={`id_${id}`} className="dropdown-item-tooltip" data-pr-tooltip={label}>
        {label}
      </div>
    </>
  );
};

export default DropdownItemTooltip;
