import * as React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Flag from 'react-world-flags';
import * as _ from 'lodash';

function Row(props) {
  const { row } = props;
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell className='expand-cell'>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell align="left" component="th" scope="row">
          {`${row.name} ( ${row.value.length} )`} <Flag className="country-icon" code={row.name} /> 
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell align="left" style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Table size="small" aria-label="purchases">
                <TableBody>
                  {row.value.map((details) => (
                    <TableRow key={details.url}>
                      <TableCell component="th" scope="row">
                        {details.url}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

const input = [
  {"country":"UA","ip":"192.168.0.1","status":"OK","ts":1646010161,"url":"https://belarus24.by"},
  {"country":"USA","ip":"192.168.0.1","status":"OK","ts":1646010161,"url":"https://belarus24.by"},
  {"country":"UA","ip":"192.168.0.1","status":"OK","ts":1646010161,"url":"https://haha.by"}
];

let rows = _(input).groupBy("country").map((value, key )=> ({ name: key, value })).value();

export default function CollapsibleTable() {
  return (
    <TableContainer className="rfo_table" component={Paper}>
      <Table aria-label="collapsible table">
        <TableBody>
          {rows.map((row) => (
            <Row key={row.name} row={row} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
