import { Button } from 'primereact/button';

const RenderColumns = ({ data }) => {
  const renderColumn = (data, index) => (
    <div key={`column-${index}`} className="min-w-30rem max-w-30rem">
      {data.map(renderColumnBlock)}
    </div>
  );

  const renderColumnBlock = ({ title, items, children }, index) => (
    <div key={`block-${index}`} className="mb-4">
      <h3 className="uppercase">{title}</h3>
      <div className="flex flex-column gap-2 w-20rem">
        {items.map(({ title, disabled, callback }, index) => (
          <Button
            key={`block-link-${index}`}
            disabled={disabled}
            label={title}
            outlined
            icon="pi pi-arrow-right"
            iconPos="right"
            className="w-full"
            pt={{
              label: {
                className: 'text-left',
              },
            }}
            onClick={callback}
          />
        ))}
        {children?.map(renderColumnBlockChild)}
      </div>
    </div>
  );

  const renderColumnBlockChild = ({ title, items, children }, index) => (
    <div key={`block-child-${index}`} className="flex flex-column gap-2 pl-4">
      <h4 className="uppercase m-0">{title}</h4>
      {items?.map(({ title, disabled, callback }, index) => (
        <Button
          key={`block-child-link-${index}`}
          disabled={disabled}
          label={title}
          outlined
          icon="pi pi-arrow-right"
          iconPos="right"
          className="w-full"
          pt={{
            label: {
              className: 'text-left',
            },
          }}
          onClick={callback}
        />
      ))}
      {children?.map(renderColumnBlockChild)}
    </div>
  );

  return <div className="grid gap-2 grid-nogutter">{data.map(renderColumn)}</div>;
};

export default RenderColumns;
