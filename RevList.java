package com.cmb.bus.product.operation;

import java.sql.Date;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.cmb.bus.common.util.Common;
import com.cmb.bus.common.util.Parameter;
import com.cmb.bus.product.util.User;
import com.frm.base.exception.FrameworkException;
import com.frm.base.model.ICacheTable;
import com.frm.base.model.imp.CacheTable;
import com.frm.base.util.StringUtil;
import com.frm.container.context.IContext;
import com.frm.container.operation.IOperation;
import com.frm.dao.model.IDBTable;
import com.frm.dao.model.imp.DBTable;

/***
 * 查询产品修订历史列表 输入：产品编码 分页参数 输出：修订历史
 * 
 * @author 80374419
 * 
 */
public class RevList implements IOperation {
	public static final String RevListX1 = "RevListX1";
	public static final String RevListZ1 = "RevListZ1";
	public static final String RevListZ2 = "RevListZ2";

	@Override
	public int execute(IContext context) throws FrameworkException {

		ICacheTable input = context.getInputData().get(RevListX1);
		if (input == null || input.getRecordCount() < 1)
			throw new FrameworkException("000", "输入参数不存在");
		
		String iPrdCd = input.getSqlString(0, "PRD_CD").trim();
		
		Boolean iFuzzy = false;
		String iRevTyp = "";
		Date iStrDte = null;
		Date iEndDte = null;
		if (input.getFieldList().contains("FUZZY")) {
			iFuzzy = input.getBoolean(0, "FUZZY");
		}
		if (input.getFieldList().contains("REV_TYP")) {
			iRevTyp = input.getSqlString(0, "REV_TYP").trim();
		}	
		if (input.getFieldList().contains("STR_DTE")) {
			iStrDte = input.getDate(0, "STR_DTE");
			if (java.sql.Date.valueOf("1900-01-01").equals(iStrDte)) {
				iStrDte = null;
			}
		}
		if (input.getFieldList().contains("END_DTE")) {
			iEndDte = input.getDate(0, "END_DTE");
			if (java.sql.Date.valueOf("1900-01-01").equals(iEndDte)) {
				iEndDte = null;
			}
		}
		
		int dwnStr = input.getInteger(0, "DWN_STR");
		int dwnCnt = input.getInteger(0, "DWN_CNT");
		int pageNo = (dwnStr - 1) / dwnCnt + 1;
		
		String sql = "SELECT A.*,B.PRD_NAM FROM PRD.REVISE A LEFT JOIN PRD.PRODUCT B ON A.PRD_CD=B.PRD_CD WHERE";

		if (!iFuzzy) {
			sql += " A.PRD_CD='" + iPrdCd + "'";
		} else {
			sql += " (A.PRD_CD like '%" + iPrdCd + "%' OR B.PRD_NAM like '%" + iPrdCd + "%')";
		}
		if (!StringUtil.isEmpty(iRevTyp)) {
			sql += " AND A.REV_TYP IN (" + Common.set2String(Common.string2List(iRevTyp)) + ")";
		}
		if (iStrDte != null) {
			sql += " AND A.REV_DTE >= '" + iStrDte + "'";
		}
		if (iEndDte != null) {
			sql += " AND A.REV_DTE <= '" + iEndDte + "'";
		}
		sql += " ORDER BY A.REV_DTE DESC,A.REV_TIM DESC";
		IDBTable table = new DBTable(context.getConnection(), RevListZ1, sql);
		table.setPage(dwnCnt);
				
		ICacheTable prdCache = table.select(pageNo);
		int count = prdCache.getRecordCount();

		prdCache.addField("REV_TYP_NAM");
		prdCache.addField("SAP_NAM");

		// 获得结果集中的员工MAP
		List<String> sapNbrList = new ArrayList<String>();
		for (int p = 0; p < count; p++) {
			String _sapNbr = prdCache.getString(p, "SAP_NBR");
			if (!StringUtil.isEmpty(_sapNbr)) {
				sapNbrList.add(_sapNbr);
			}
		}
		Map<String, String> sapMap = User.getName(context, sapNbrList);
		
		for (int i = 0; i < count; i++) {
			String _revTyp = prdCache.getString(i, "REV_TYP");
			String _sapNbr = prdCache.getString(i, "SAP_NBR");

			prdCache.update(i, "REV_TYP_NAM", Parameter.getName("REVTYP", _revTyp));
			prdCache.update(i, "SAP_NAM", sapMap.get(_sapNbr));
		}
		
		ICacheTable countTable = new CacheTable(RevListZ2, "RCD_CNT");
		countTable.insert(table.getRecordCount());

		context.addOutputData(prdCache);
		context.addOutputData(countTable);
		return 0;
	}
}
