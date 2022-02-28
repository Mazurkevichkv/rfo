import * as React from 'react';
import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Flag from 'react-world-flags';
import * as _ from 'lodash';
const PULL_INTERVAL = 10_000;

function useInterval(callback, delay) {
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// This method is created for cross-browser compatibility, if you don't
// need to support IE11, you can use Array.prototype.sort() directly
function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

function EnhancedTableHead(props) {
  const { onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort, headCells} =
    props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell, i) => (
          <TableCell
            className='flag_header'
            key={headCell.id + i}
            align="left"
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <span>{headCell.label}</span>
            {headCell?.icon}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

export default function RFO() {
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('');
  const [rows, setRows] = React.useState([]);
  const [countries, setCountries] = React.useState([]);
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(100);

  const fetchData = () => {
    fetch("http://34.65.125.42/snapshot")
    .then(response => {
      if (!response.ok) {
          throw new Error("HTTP error " + response.status);
      }
      return response.json();
    })
    .then(json => {
      let countries = _(json).map("country").uniq().value();
      setCountries(countries);

      let rows = _(json).groupBy("url").map((value, key )=> ({ name: key, availability: `${_(value).filter((a) => a.status == "OK" ).value().length} / ${value.length}`, countries: value })).value();
      rows.forEach((row) => {
        var newCountries = [];
        countries.forEach(country => {
          
          var oldCountries = _.filter(row.countries, c => c.country == country);
          var result = {};
          result.status = (_.reduce(oldCountries, function(sum, n) {
            return sum + (n.status == "OK" ? 100 : 0);
          }, 0)) / oldCountries.length;

          newCountries.push(oldCountries.length ? result : {});
        })
        row.countries = newCountries;
      });

      setRows(rows)
    })
    .catch(function () {
    })
  };

  useInterval(fetchData, PULL_INTERVAL);
  useEffect(fetchData, []);
  

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = rows.map((n) => n.name);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, name) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

 
  const headCells = [
    {
      id: 'url',
      numeric: false,
      disablePadding: true,
      label: 'URL',
    },
    {
      id: 'availability',
      numeric: false,
      disablePadding: false,
      label: 'Availability',
    },
    ...(countries.map(country => ({
      id: country,
      numeric: false,
      disablePadding: false,
      label: country,
      icon: <Flag className="country-icon" code={country} /> 
    }))),
  ];

  const isSelected = (name) => selected.indexOf(name) !== -1;

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  return !rows.length ? <p>Loading...</p> :
    (<Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer className="rfo_table">
          <Table
            sx={{ minWidth: 750 }}
            aria-labelledby="tableTitle"
          >
            <EnhancedTableHead
              numSelected={selected.length}
              order={order}
              headCells={headCells}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={rows.length}
            />
            <TableBody>
              {/* if you don't need to support IE11, you can replace the `stableSort` call with:
                 rows.slice().sort(getComparator(order, orderBy)) */}
              {stableSort(rows, getComparator(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, i) => {
                  const isItemSelected = isSelected(row.name);
                  const labelId = `enhanced-table-checkbox-${i}`;
                  return (
                    <TableRow
                      hover
                      onClick={(event) => handleClick(event, row.name)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={row.name + i}
                      selected={isItemSelected}
                    >
                      
                      <TableCell
                        component="th"
                        id={labelId}
                        scope="row"
                        key={"name" + i + "_0"}
                        padding="none"
                      >
                        {row.name}
                      </TableCell>
                      <TableCell
                        component="th"
                        id={labelId}
                        scope="row"
                        padding="none"
                        key={"aval" + i + "_1"}
                      >
                        {row.availability}
                      </TableCell>
                        {
                            row.countries.map((country, j) => <TableCell className={ country.status > 90 ? `green` : country.status < 10 ? `red` : 'yellow' } key={"status" + i + "_" + j} align="left">{country.status != undefined ? country.status + " %" : "" }</TableCell>)
                        }
                    </TableRow>
                  );
                })}
              {emptyRows > 0 && (
                <TableRow
                  style={{
                    height: 30 * emptyRows,
                  }}
                >
                  <TableCell colSpan={6}></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}
